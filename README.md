# @ndiinginc/router

Router HTTP kecil, cepat, dan **zero-dependency** untuk Node.js. Dibangun langsung di atas `node:http`, dengan routing berbasis tree, nested router, middleware async, error handler, dan JSON body parser bawaan.

## Fitur

- Zero dependency, murni `node:http`
- Routing berbasis tree per segment (static match diprioritaskan, lalu dynamic)
- Parameter dinamis `:id` dan wildcard `*`
- Nested router dengan `use(path, router)`
- Middleware global dan per-path, mendukung `async`
- Error handler dengan signature `(err, req, res)`
- `req.path`, `req.query`, `req.params`, `req.body`
- Helper `res.send()` dan `res.json()`
- JSON body parser dengan limit ukuran dan proteksi prototype pollution
- Semua HTTP method, termasuk `QUERY`

## Instalasi

```bash
npm install @ndiinginc/router
```

Butuh **Node.js 22.1+** (memakai `URL.parse`).

## Quick Start

```js
const Router = require("@ndiinginc/router");

const app = new Router();

app.get("/", (req, res) => {
    res.json({ hello: "world" });
});

app.get("/users/:id", (req, res) => {
    res.json({ id: req.params.id });
});

app.listen(3000);
```

## Routing

Semua method mengembalikan `this`, jadi bisa di-chain.

```js
app.get("/users", handler)
   .post("/users", handler)
   .put("/users/:id", handler)
   .patch("/users/:id", handler)
   .delete("/users/:id", handler);
```

Method yang tersedia: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`, `trace`, `connect`, `query`, dan `use` (semua method).

### Parameter dinamis

```js
app.get("/posts/:postId/comments/:commentId", (req, res) => {
    const { postId, commentId } = req.params;
    res.json({ postId, commentId });
});
```

### Wildcard

`*` cocok dengan karakter apa pun di dalam satu segmen.

```js
app.get("/files/report-*", (req, res) => {
    res.json({ path: req.path });
});
```

### Prioritas match

Untuk setiap segmen, router mencoba **static match dulu**, baru pattern dinamis. Jadi `/users/me` menang atas `/users/:id` bila keduanya terdaftar.

## Middleware

Middleware didaftarkan dengan `use()` dan dijalankan **berurutan sesuai urutan pendaftaran**.

```js
// Global
app.use((req, res) => {
    console.log(req.method, req.path);
});

// Scoped: jalan untuk /admin dan semua sub-path-nya
app.use("/admin", async (req, res) => {
    if (req.headers.authorization !== "secret") {
        res.statusCode = 401;
        res.json({ error: "Unauthorized" });
    }
});
```

Chain berhenti otomatis begitu response dikirim (`res.send()` / `res.json()` menandai `res.done = true`), jadi handler berikutnya tidak dipanggil.

> Middleware global tetap dijalankan walaupun tidak ada route yang cocok (sebelum 404 dikirim).

## Nested Router

Pecah aplikasi jadi beberapa router lalu pasang dengan `use(path, router)`. Nesting bisa berlapis.

```js
const users = new Router();
users.get("/", (req, res) => res.json({ list: [] }));
users.get("/:id", (req, res) => res.json({ id: req.params.id }));

const admin = new Router();
admin.use("/users", users);

const app = new Router();
app.use("/admin", admin);

// GET /admin/users      -> list
// GET /admin/users/42   -> { id: "42" }
```

## Error Handling

Handler dengan **tiga argumen** `(err, req, res)` dikenali sebagai error handler. Error handler dipanggil saat handler atau middleware melempar error (sync maupun async).

```js
app.get("/boom", () => {
    throw new Error("Something broke");
});

app.use((err, req, res) => {
    res.statusCode = err.statusCode || 500;
    res.json({ error: err.message });
});
```

### Respons default

Jika tidak ada handler yang mengirim response, router mengirim JSON otomatis:

```json
{ "error": { "code": undefined, "message": "Not Found" } }
```

- Tidak ada route cocok: status `404`
- Error dengan status 2xx: dinaikkan menjadi `500`
- Saat `NODE_ENV=development`, field `stack` ikut disertakan

## Request

| Properti | Keterangan |
| --- | --- |
| `req.path` | Pathname tanpa query string |
| `req.query` | Object query string. Key yang berulang menjadi array |
| `req.params` | Parameter dari route dinamis |
| `req.body` | Hasil parse body (butuh middleware `json()`) |

```js
// GET /search?tag=a&tag=b&page=2
app.get("/search", (req, res) => {
    res.json(req.query); // { tag: ["a", "b"], page: "2" }
});
```

## Response

| Method | Keterangan |
| --- | --- |
| `res.send(string)` | Kirim response dan akhiri chain |
| `res.json(object)` | Set `content-type: application/json`, serialize, lalu kirim |

Keduanya juga turunan dari `http.ServerResponse`, jadi `res.statusCode`, `res.setHeader()`, dan lainnya tetap tersedia.

## JSON Body Parser

```js
const Router = require("@ndiinginc/router");
const { json } = require("@ndiinginc/router/middleware");

const app = new Router();

app.use(json({ limit: 100 * 1024 })); // default 100 KB

app.post("/users", (req, res) => {
    res.json({ received: req.body });
});
```

Perilaku:

- Hanya memproses method `POST`, `PUT`, `PATCH`, dan `QUERY` dengan `content-type: application/json`
- Body melebihi `limit` memicu error `413 Payload Too Large` (dicek lewat `content-length` dan saat streaming)
- JSON tidak valid memicu error `400 Invalid JSON body`
- Body kosong menghasilkan `req.body = null`
- Key `__proto__`, `constructor`, dan `prototype` dibuang untuk mencegah prototype pollution

## API

### `new Router()`

Membuat instance router baru.

### `router.use([path], handler | router)`

Mendaftarkan middleware, error handler, atau nested router untuk semua method.

### `router.<method>([path], handler)`

Mendaftarkan handler untuk method tertentu. `path` opsional; jika dihilangkan, handler dipasang di root router.

### `router.find(method, path)`

Mencari route tanpa menjalankannya. Berguna untuk testing.

```js
const { params, handlers, errorHandlers } = app.find("GET", "/users/1");
```

### `router.listen(...args)`

Membuat `http.Server` dengan `Request` dan `Response` milik router, lalu memanggil `server.listen(...args)`. Mengembalikan instance `http.Server`.

```js
const server = app.listen(0); // port acak
console.log(server.address().port);
```

## Testing

```bash
npm test
```

## Lisensi

MIT
