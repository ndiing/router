# @ndiinginc/router

A small, zero-dependency HTTP router for Node.js, built directly on `node:http`. Radix-trie routing, plain `(req, res)` handlers and no `next()`.

```js
const App = require("@ndiinginc/router");

const app = new App();
app.use(App.json());

app.get("/users/:id", (req, res) => res.json({ id: req.params.id }));
app.post("/users", (req, res) => res.status(201).json(req.body));

app.listen(3000);
```

## Features

- Zero dependencies
- Radix-trie routing: static > `:param` > `*` wildcard, with backtracking
- Familiar API: `app.get`, `app.use`, nested routers
- Handlers and middleware are plain `(req, res)` functions. No `next()`, `async` is supported
- Error handlers with the signature `(err, req, res)`
- Per-request timeout (`504`) backed by an `AbortController`
- Built-in `json()`, `urlencoded()` and `cors()` middleware
- All HTTP methods, including `QUERY`

## Design

- **Radix trie.** Routes live in a compressed prefix tree whose children are indexed by their first character, so choosing the next branch is a single `Map` lookup and a lookup follows the request path instead of walking a list of routes. Static branches are tried first, then `:param`, then `*`, and the router backtracks when a branch dead-ends.
- **Registration order.** Every handler gets a sequence number when it is registered, and the handlers that apply to a request always run in that order, wherever they sit in the tree. Middleware, route handlers and mounted routers share one ordering.
- **No `next()`.** A handler responds, throws, or simply returns, in which case the next one runs. The chain stops as soon as the response has been sent with `res.send()`, `res.json()` or `res.download()`.
- **Errors are plain throws.** Throwing or rejecting skips to the error handlers `(err, req, res)`, then to a default JSON error response.
- **Small surface.** `req` and `res` are Node's own classes with a few additions (`req.path`, `req.query`, `req.params`, `req.body`, `req.controller`, `res.status`, `res.send`, `res.json`). Everything else comes from middleware you add.

It fits small HTTP services and gateways that want routing, body parsing and CORS without the weight of a full framework. If you need a large plugin ecosystem, schema validation or a lot of built-in helpers, this is not it.

## Install

```bash
npm install @ndiinginc/router
```

Requires Node.js 18.3 or newer (`res.appendHeader` is used by the CORS middleware).

## Quick start

```js
const App = require("@ndiinginc/router");

const app = new App();

app.use(App.json());
app.use(App.cors());

app.get("/", (req, res) => res.json({ ok: true }));
app.get("/users/:id", (req, res) => res.json({ id: req.params.id }));
app.post("/users", (req, res) => res.status(201).json(req.body));

app.listen(3000, () => console.log("http://localhost:3000"));
```

`app.listen(...)` forwards its arguments to `server.listen(...)` and returns the `http.Server`, so the usual callback works.

## API

### `new App(options?)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `requestTimeout` | `number` | `0` | Request timeout in ms. `0` disables it. Responds with `504` on timeout. |

```js
const app = new App({ requestTimeout: 5000 });
```

`App` extends `Router`. Use `new App.Router()` for routers that are only mounted into another router.

### Routing

```js
app.get(path, ...handlers)
app.post(path, ...handlers)
app.put(path, ...handlers)
app.patch(path, ...handlers)
app.delete(path, ...handlers)
app.head(path, ...handlers)
app.options(path, ...handlers)
app.trace(path, ...handlers)
app.connect(path, ...handlers)
app.query(path, ...handlers)   // QUERY method (non-standard, useful for complex queries)
app.use(path?, ...handlers)    // all methods
```

All of them return `app`, so calls can be chained. Route paths must start with `/`. Matching is case-sensitive, and `//` is not collapsed.

**Path syntax:**

| Pattern | Example | Matches |
| --- | --- | --- |
| Static | `/api/users` | `/api/users` |
| Param | `/users/:id` | `/users/123` gives `req.params.id = "123"` |
| Wildcard | `/files/*` | `/files/a/b/c` gives `req.params.wildcard = "a/b/c"` |

- A `:param` matches one whole segment (up to the next `/`) and must not be empty. The value is URL-decoded; malformed escapes such as `%` are kept as they are.
- `*` captures the rest of the path. The value is URL-decoded as a whole, and `/files/*` does not match `/files/` (nothing after the slash).
- **Trailing slash:** if a path does not match, it is retried with the trailing slash added or removed, so `/users` and `/users/` reach the same route. When both are registered, the exact one wins.
- **Priority:** static > param > wildcard. If a branch fails further down, the router backtracks and tries the next one.
- **Matching is method-aware.** If a static route has no handler for the request method, the router falls back to a param or wildcard route that has one. With `GET /users/me` and `PUT /users/:id`, a `PUT /users/me` is handled by `PUT /users/:id`.

**Multiple params:**

```js
app.get("/users/:userId/posts/:postId", (req, res) => {
    res.json(req.params);   // { userId: "...", postId: "..." }
});
```

Params with different names may share a level, for example `/users/:id` and `/users/:userId/posts`.

**Nested routers:**

```js
const users = new App.Router();
users.get("/:id", (req, res) => res.json({ id: req.params.id }));

app.use("/users", users);
// GET /users/42  ->  users "/:id"
```

The contents of a router are copied when it is mounted. Register every route on the router **before** calling `app.use(path, router)`; routes added afterwards are not picked up. The same router can be mounted at several paths.

---

### Middleware

Middleware is a **2-arg** function `(req, res)`. There is **no `next()`**: handlers run in order, and the chain stops as soon as the response has been sent with `res.send()`, `res.json()` or `res.download()`.

```js
app.use((req, res) => {
    req.startTime = Date.now();
    // no next(): the chain continues automatically
});

app.get("/", (req, res) => {
    res.json({ elapsed: Date.now() - req.startTime });
});
```

**Order matters.** Handlers run in registration order, regardless of where they sit in the tree.

```js
app.use(auth);              // 1st
app.use("/api", logger);    // 2nd
app.get("/api/car", h);     // 3rd
// order: auth -> logger -> h
```

### Errors

Throw (or reject) to hand control to the error handlers. An **error handler** is a 3-arg function `(err, req, res)`:

```js
app.get("/admin", (req, res) => {
    res.status(403);
    throw new Error("Forbidden");
});

app.use((err, req, res) => {
    const status = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(status).json({ error: err.message });
});
```

If no error handler responds, a default JSON response is sent:

```json
{ "error": { "message": "Not Found" } }
```

- The status comes from `res.statusCode`. If it is still below 400 when an error is handled, it becomes `500`. A `statusCode` property on the error object is **not** used.
- A request that matches no route gets `404`.
- `stack` is only included when `NODE_ENV=development`.
- If an error handler throws as well, the default response is sent for the new error (the original is kept in `cause`).

Handlers are recognised by arity (`handler.length === 3`), so do not use default or rest parameters in handler signatures.

---

### Request

| Property | Type | Description |
| --- | --- | --- |
| `req.method` | `string` | HTTP method |
| `req.url` | `string` | Raw URL (from Node) |
| `req.path` | `string` | Path only (query and hash stripped) |
| `req.query` | `object` | Parsed query string (null prototype) |
| `req.params` | `object` | Route params (null prototype) |
| `req.body` | `any` | Parsed body (from the `json` / `urlencoded` middleware) |
| `req.headers` | `object` | Request headers |
| `req.controller` | `AbortController` | Abort signal for timeouts and cancellation |

`req.query` is parsed lazily with `URLSearchParams`: repeated keys become arrays, `+` becomes a space, and a key without a value (`?flag`) is an empty string.

`req.query` and `req.params` have a **null prototype**, which protects against prototype pollution:

```js
// GET /search?__proto__=x
req.query.__proto__          // "x" (a plain own property)
({}).__proto__               // unchanged
```

Because of that, use `Object.hasOwn(req.query, "key")` or `"key" in req.query` instead of `req.query.hasOwnProperty(...)`.

### Response

| Method | Description |
| --- | --- |
| `res.status(code)` | Set the status code, chainable |
| `res.send(string)` | Send a string with `Content-Type: text/html` |
| `res.json(value)` | Send JSON with `Content-Type: application/json` |
| `res.download(path, filename?)` | Stream a file as an attachment (`filename` defaults to the file's name) |
| `res.setHeader(name, value)` | Set a header (from Node) |
| `res.appendHeader(name, value)` | Append a header (from Node 18.3) |

```js
res.status(201).json({ created: true });
res.send("hello");
```

Send the response once per request: `res.send()`, `res.json()` and `res.download()` are meant to be the last call in a handler. Never pass a user-controlled path to `res.download()`.

---

### Built-in middleware

#### `App.json(options?)`

Parses JSON bodies. Only runs on `POST`, `PUT`, `PATCH` and `QUERY` requests with a JSON `Content-Type`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | `number` | `102400` (100 KB) | Max body size in bytes |

```js
app.use(App.json({ limit: 1024 * 1024 }));   // 1 MB
```

- **Prototype pollution guard:** `__proto__`, `constructor` and `prototype` keys are removed.
- **Size limit:** `Content-Length` is checked up front and the size is checked again while streaming. Too large gives `413`.
- **Empty body:** `req.body = null`.
- **Invalid JSON:** `400`, with the parse error in `cause`.

#### `App.urlencoded(options?)`

Parses `application/x-www-form-urlencoded` bodies. Same methods, `limit` option, `413` behaviour and empty-body handling as `App.json`.

The result follows the same rules as `req.query`: a null-prototype object, repeated keys become arrays, `+` becomes a space.

```js
app.use(App.urlencoded());

app.post("/login", (req, res) => {
    // body: user=ndiing&tag=a&tag=b
    res.json(req.body);   // { user: "ndiing", tag: ["a", "b"] }
});
```

#### `App.cors(options?)`

CORS middleware with preflight support.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `origin` | `string \| string[] \| null` | `"*"` | Allowed origin(s). `null` never sends `Access-Control-Allow-Origin`. |
| `credentials` | `boolean` | `false` | Allow credentials (cookies, auth headers) |
| `headers` | `string \| string[]` | none | Allowed request headers (preflight) and exposed response headers |
| `methods` | `string \| string[]` | none | Allowed methods |
| `maxAge` | `number` | `0` | Preflight cache time in seconds. `0` omits the header. |

```js
app.use(App.cors({
    origin: ["https://app.example.com", "https://admin.example.com"],
    credentials: true,
    headers: ["content-type", "authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    maxAge: 3600,
}));
```

- A **preflight** is an `OPTIONS` request with an `Access-Control-Request-Method` header. It is answered with `204` and the chain stops. Other `OPTIONS` requests continue to the next handler.
- Origins are compared **exactly** (case-sensitive) with the request's `Origin` header. A match is echoed back.
- With an array, `Access-Control-Allow-Headers` is only sent if **every** requested header is allowed, and `Access-Control-Allow-Methods` only if the requested method is allowed.
- Without `headers` / `methods`, the values requested in the preflight are echoed back.
- `headers` (as an array or `"*"`) is also sent as `Access-Control-Expose-Headers` on non-preflight requests.

**Security notes:**

- `origin: "*"` together with `credentials: true` echoes whichever origin sent the request. That is what the CORS spec requires (a literal `*` is invalid with credentials), but it allows **every** site to make credentialed requests. Use it for development only and list explicit origins in production.
- `headers: "*"` or `methods: "*"` together with `credentials: true` does not send `*`; the requested values are echoed instead.
- `Vary: Origin` is added only when the origin is echoed (not for a plain `*`).

---

### Timeout

```js
const app = new App({ requestTimeout: 5000 });

app.get("/slow", async (req, res) => {
    await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 10000);
        req.controller.signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(req.controller.signal.reason);
        }, { once: true });
    });
    res.json({ done: true });
});
// GET /slow  ->  504 Gateway Timeout after 5s
```

When the timeout fires, the status is set to `504` and the request fails with a `Gateway Timeout` error, which goes through your error handlers like any other error.

Handlers are **not** forcibly stopped. A handler keeps running unless it listens to `req.controller.signal` (or passes it to something that does, such as `fetch(url, { signal })`). Once the response has ended, the rest of the chain is skipped.

`req.controller` is also aborted if a handler throws, with the error as the reason.

---

## Porting from Express

```js
// Express
const express = require("express");
const app = express();
app.use(express.json());
app.get("/", (req, res) => res.json({ ok: true }));
app.use((err, req, res, next) => res.status(500).json({}));

// This router
const App = require("@ndiinginc/router");
const app = new App();
app.use(App.json());
app.get("/", (req, res) => res.json({ ok: true }));
app.use((err, req, res) => res.status(500).json({}));
```

**Key differences:**

- Middleware is **2-arg** (no `next`). Error handlers are **3-arg** (no `next`).
- `express.json()` becomes `App.json()`, `express.urlencoded()` becomes `App.urlencoded()`, `cors()` becomes `App.cors()`.
- Errors take their status from `res.statusCode`, not from `err.statusCode`.

**Using Express-style middleware.** Middleware that calls `next()` can be wrapped in a small adapter:

```js
const wrap = (middleware) => (req, res) =>
    new Promise((resolve, reject) => {
        res.once("close", resolve); // the middleware answered by itself
        middleware(req, res, (err) => (err ? reject(err) : resolve()));
    });

app.use(wrap(require("helmet")()));
```

This only covers the `next()` contract. Middleware that relies on Express-only extensions (`req.app`, `res.locals`, `res.redirect()` and similar) will still not work.

## Limitations

- **No `next()`.** Middleware must respond or throw (or be wrapped, see above).
- **No route removal.** Routes are registered once at startup.
- **No convenience helpers** such as `res.redirect()`, `res.cookie()`, `res.sendFile()`, `req.ip` or `req.get()`. Use the Node equivalents: `res.status(302); res.setHeader("Location", url); res.send("")`, `res.setHeader("Set-Cookie", ...)`, `req.socket.remoteAddress`, `req.headers`.
- **No static file serving, compression or cookie parsing.** Use a reverse proxy (nginx, Caddy) or add your own middleware.

These are deliberate omissions: the core stays small and features come from middleware.

## Benchmark

Environment: Windows, one machine (the load generator and the server share the CPU), `autocannon -c 100 -p 10 -d 40`, a single route `GET /` that returns `{ "hello": "world" }`.

| Framework | Req/s (avg) | Latency p50 | Latency p99 |
| --- | --- | --- | --- |
| Fastify | 55,802 | 14 ms | 95 ms |
| node:http | 50,628 | 16 ms | 105 ms |
| @ndiinginc/router | 48,150 | 17 ms | 121 ms |
| Express | 28,652 | 30 ms | 195 ms |

A single-route hello world measures per-request overhead, not routing at scale, and the numbers move with hardware, Node.js version and load.

To reproduce (each framework runs in its own process, results are the median of several runs, and a run is rejected if a response is not the expected one):

```bash
npm i -D autocannon express fastify
node benchmark/run.js
```

## Testing

```bash
npm test
```

## License

MIT

## Credits

Built from scratch as a learning project: the radix trie, middleware chain, sub-routers, timeout handling, CORS and body parsers are all custom.

Inspired by Express (API), Fastify (performance mindset) and `find-my-way` (radix-trie routing).
