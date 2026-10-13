# @ndiinginc/router

Router HTTP kecil, cepat, dan **zero-dependency** untuk Node.js. Dibangun langsung di atas `node:http`, dengan routing berbasis tree, LRU cache untuk lookup route, nested router, middleware async, error handler, timeout per request, serta middleware `json` dan `cors` bawaan.

## Fitur

- Zero dependency, murni `node:http`
- Routing berbasis tree per segmen (static match diprioritaskan, lalu dynamic)
- Parameter dinamis `:id` dan wildcard `*`
- LRU cache untuk hasil lookup route
- Nested router dengan `use(path, router)`
- Middleware global dan per-path, mendukung `async`
- Error handler dengan signature `(err, req, res)`
- Timeout per request (`req.timeout`) yang menghasilkan `504`
- `req.path`, `req.query`, `req.params`, `req.body`
- Helper `res.send()` dan `res.json()`
- Middleware bawaan: `json()` (dengan limit dan proteksi prototype pollution) dan `cors()`
- Semua HTTP method, termasuk `QUERY`

## Instalasi

```bash
npm install @ndiinginc/router
```

Butuh Node.js 18.3 atau lebih baru.

## Quick Start

```js
const App = require("@ndiinginc/router");

const app = new App();

app.use(App.json());

app.get("/", (req, res) => {
    res.json({ hello: "world" });
});

app.get("/users/:id", (req, res) => {
    res.json({ id: req.params.id });
});

app.post("/users", (req, res) => {
    res.json({ received: req.body });
});

app.listen(3000);
```

Yang diekspor adalah class `App`, dengan tiga properti tambahan:

| Export | Keterangan |
| --- | --- |
| `App` | Router + HTTP server (`listen`) |
| `App.Router` | Router tanpa server, untuk nested router |
| `App.json` | Middleware JSON body parser |
| `App.cors` | Middleware CORS |

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

Satu route boleh punya beberapa handler:

```js
app.get("/profile", authenticate, loadUser, (req, res) => {
    res.json(req.user);
});
```

### Parameter dinamis

```js
app.get("/posts/:postId/comments/:commentId", (req, res) => {
    const { postId, commentId } = req.params;
    res.json({ postId, commentId });
});
```

### Wildcard

`*` cocok dengan karakter apa pun **di dalam satu segmen**. Wildcard tidak melintasi `/`.

```js
app.get("/files/report-*", (req, res) => {
    res.json({ path: req.path });
});
```

### Aturan matching

- Untuk setiap segmen, router mencoba **static match dulu**, baru pattern dinamis. Jadi `/users/me` menang atas `/users/:id` bila keduanya terdaftar.
- Jika ada beberapa pattern dinamis di level yang sama, yang **terdaftar lebih dulu** yang dipakai (tanpa backtracking).
- Trailing slash dan slash ganda diabaikan: `/users`, `/users/`, dan `//users` dianggap sama.

## Middleware

Middleware didaftarkan dengan `use()`. Semua handler (middleware dan route) dijalankan **berurutan sesuai urutan pendaftaran**.

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

Chain berhenti otomatis begitu response selesai dikirim (`res.writableEnded`), jadi handler berikutnya tidak dipanggil.

> Middleware tetap dijalankan walaupun tidak ada route yang cocok, sebelum respons 404 dikirim.

## Nested Router

Pecah aplikasi menjadi beberapa router, lalu pasang dengan `use(path, router)`. Nesting bisa berlapis.

```js
const { Router } = App;

const users = new Router();
users.get("/", (req, res) => res.json({ list: [] }));
users.get("/:id", (req, res) => res.json({ id: req.params.id }));

const admin = new Router();
admin.use("/users", users);

const app = new App();
app.use("/admin", admin);

// GET /admin/users      -> { list: [] }
// GET /admin/users/42   -> { id: "42" }
```

> Tree sub-router digabungkan saat `use()` dipanggil. Daftarkan semua route ke sub-router **sebelum** di-mount; route yang ditambahkan setelahnya tidak ikut. Satu instance sub-router sebaiknya hanya di-mount satu kali.

## Error Handling

Handler dengan **tiga argumen** `(err, req, res)` dikenali sebagai error handler. Dipanggil saat handler atau middleware melempar error (sync maupun async).

```js
app.get("/boom", () => {
    throw new Error("Something broke");
});

app.use((err, req, res) => {
    res.statusCode = err.statusCode || 500;
    res.json({ error: { message: err.message } });
});
```

> Deteksi error handler memakai `handler.length === 3`. Jangan memakai default parameter atau rest parameter di signature handler, karena mengubah `length`.

### Menentukan status code

Ada dua cara:

```js
// 1. Properti statusCode pada error
app.get("/admin", () => {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
});

// 2. Set res.statusCode sebelum throw
app.get("/limit", (req, res) => {
    res.statusCode = 429;
    throw new Error("Too Many Requests");
});
```

### Respons default

Jika tidak ada handler yang mengirim response, router mengirim JSON otomatis:

```json
{ "error": { "message": "Not Found" } }
```

- Tidak ada route cocok: `404 Not Found`
- Error tanpa status code: `500`
- Jika `res.statusCode` sudah `>= 400`, nilainya dipertahankan
- Jika error handler sendiri melempar error, error baru dibuat dengan `cause` menunjuk error asli

- Field `stack` hanya disertakan saat `NODE_ENV=development`

## Timeout

Set `req.timeout` (milidetik) untuk membatasi waktu eksekusi handler. Jika terlampaui, error `504 Gateway Timeout` dilempar dan diteruskan ke error handler.

```js
app.use((req) => {
    req.timeout = 5000;
});
```

- Nilai default `0` (tanpa timeout)
- Harus diset **secara sinkron di middleware pertama** pada chain, karena dibaca sesaat setelah chain mulai berjalan
- Timeout tidak membatalkan handler yang sedang berjalan; hanya menghentikan penantian dan mengirim error

## Request

| Properti | Keterangan |
| --- | --- |
| `req.path` | Pathname tanpa query string |
| `req.query` | Object query string, di-parse secara lazy. Key yang berulang menjadi array |
| `req.params` | Parameter dari route dinamis (sudah di-decode dengan `decodeURIComponent`) |
| `req.body` | Hasil parse body (butuh middleware `json()`) |
| `req.timeout` | Batas waktu handler dalam ms (default `0`) |

```js
// GET /search?tag=a&tag=b&page=2
app.get("/search", (req, res) => {
    res.json(req.query); // { tag: ["a", "b"], page: "2" }
});
```

`Request` adalah turunan `http.IncomingMessage`, jadi `req.headers`, `req.method`, dan lainnya tetap tersedia.

## Response

| Method | Keterangan |
| --- | --- |
| `res.send(chunk)` | Kirim response dan akhiri |
| `res.json(value)` | Set `Content-Type: application/json`, serialize, lalu kirim |

`Response` adalah turunan `http.ServerResponse`, jadi `res.statusCode`, `res.setHeader()`, dan lainnya tetap tersedia.

## Middleware Bawaan

### `json([options])`

```js
app.use(App.json({ limit: 100 * 1024 })); // default 100 KB
```

| Opsi | Default | Keterangan |
| --- | --- | --- |
| `limit` | `102400` | Ukuran body maksimum dalam byte |

Perilaku:

- Hanya memproses method `POST`, `PUT`, `PATCH`, dan `QUERY` dengan `Content-Type: application/json`
- Body melebihi `limit` menghasilkan `413 Payload Too Large` (dicek lewat `Content-Length` dan saat streaming)
- JSON tidak valid menghasilkan `400` dengan pesan `Invalid JSON body`
- Body kosong menghasilkan `req.body = null`
- Key `__proto__`, `constructor`, dan `prototype` dibuang untuk mencegah prototype pollution

### `cors([options])`

```js
app.use(
    App.cors({
        origin: "https://example.com",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        headers: ["Content-Type", "Authorization"],
        maxAge: 600,
    }),
);
```

| Opsi | Default | Keterangan |
| --- | --- | --- |
| `origin` | `"*"` | `"*"`, string origin, atau `null` |
| `credentials` | `false` | Mengirim `Access-Control-Allow-Credentials: true` |
| `headers` | - | `"*"` atau array nama header |
| `methods` | - | `"*"` atau array nama method |
| `maxAge` | `0` | Lama cache preflight (detik). `0` berarti header tidak dikirim |

Perilaku:

- Request `OPTIONS` dijawab langsung dengan `204` dan chain berhenti
- Dengan `origin: "*"` dan `credentials: true`, origin dari request dipantulkan dan header `Vary: Origin` ditambahkan
- Nilai `"*"` untuk `headers` dan `methods` diabaikan saat `credentials: true`, sesuai spesifikasi CORS
- Pada request non-preflight, `headers` (jika array) dikirim sebagai `Access-Control-Expose-Headers`

## Opsi Router

```js
const app = new App({ size: 1000 });
```

| Opsi | Default | Keterangan |
| --- | --- | --- |
| `size` | `1000` | Jumlah maksimum entri LRU cache untuk hasil lookup `METHOD path` |

## API

### `new App([options])` / `new Router([options])`

Membuat instance baru. `App` adalah `Router` ditambah `listen()`.

### `router.use([path], ...handlers | router)`

Mendaftarkan middleware, error handler, atau nested router untuk semua method.

### `router.<method>([path], ...handlers)`

Mendaftarkan handler untuk method tertentu. `path` opsional; jika dihilangkan, handler dipasang di root.

### `router.find(method, path)`

Mencari route tanpa menjalankannya. Hasilnya di-cache. Berguna untuk testing.

```js
const { params, handlers, errorHandlers } = app.find("GET", "/users/1");
```

### `app.listen(...args)`

Membuat `http.Server` dengan `Request` dan `Response` milik router, lalu memanggil `server.listen(...args)`. Mengembalikan instance `http.Server`.

```js
const server = app.listen(0); // port acak
console.log(server.address().port);
```

## Benchmark

Hello world dengan satu route `GET /`, diuji memakai `autocannon -c 100 -d 40 -p 10` di mesin lokal.

| | Req/sec (avg) | Latency (avg) |
| --- | --- | --- |
| Fastify | 31.475 | 31,27 ms |
| **@ndiinginc/router** | 29.735 | 33,12 ms |
| Express | 20.211 | 48,93 ms |

Hasil bervariasi tergantung mesin, versi Node.js, dan jumlah route. Benchmark ini hanya menggambarkan overhead dasar, bukan performa aplikasi nyata.

## Testing

```bash
npm test
```

## Lisensi

MIT
