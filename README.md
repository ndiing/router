# @ndiinginc/router

Router HTTP kecil, cepat, dan **zero-dependency** untuk Node.js. Dibangun langsung di atas `node:http`, dengan routing berbasis tree, LRU cache untuk lookup route, nested router, middleware async, error handler, timeout per request, serta middleware `json` dan `cors` bawaan.

## Fitur

- Zero dependency, murni `node:http`
- Routing berbasis tree per segmen: static, lalu `:param`, lalu wildcard `*`, dengan backtracking
- Parameter dinamis `:id` dan wildcard `*` yang menangkap sisa path
- LRU cache untuk hasil lookup route
- Nested router dengan `use(path, router)`
- Middleware global dan per-path, mendukung `async`
- Error handler dengan signature `(err, req, res)`
- Timeout per request yang menghasilkan `504`, dengan `req.signal` untuk pembatalan kooperatif
- `req.path`, `req.query`, `req.params`, `req.body`
- Helper `res.status()`, `res.send()`, dan `res.json()`
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
    res.status(201).json({ received: req.body });
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

Segmen yang diawali `:` adalah parameter. Nilainya otomatis di-decode dengan `decodeURIComponent`; jika formatnya tidak valid (misalnya `%`), nilai mentah dipakai apa adanya.

```js
app.get("/posts/:postId/comments/:commentId", (req, res) => {
    const { postId, commentId } = req.params;
    res.json({ postId, commentId });
});
```

Satu segmen adalah satu parameter utuh; nama parameter tidak bisa digabung dengan teks lain dalam segmen yang sama (`:id.json` akan dianggap parameter bernama `id.json`).

> Di setiap level hanya ada satu parameter. Jika `/users/:id` dan `/users/:userId/posts` didaftarkan bersamaan, keduanya memakai nama yang pertama didaftarkan (`id`). Pakai nama yang sama untuk level yang sama.

### Wildcard

Segmen `*` menangkap **seluruh sisa path** (termasuk `/`) dan nilainya tersedia di `req.params[0]`.

```js
app.get("/files/*", (req, res) => {
    res.json({ file: req.params[0] });
});

// GET /files/images/logo.png -> { file: "images/logo.png" }
```

Wildcard butuh minimal satu segmen tersisa, jadi `/files/*` tidak cocok dengan `/files`.

### Aturan matching

- Di setiap level, router mencoba **static dulu, lalu parameter, lalu wildcard**. Jadi `/users/me` menang atas `/users/:id` bila keduanya terdaftar.
- Jika cabang static gagal di tengah jalan, router mundur (backtrack) dan mencoba parameter, lalu wildcard.
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
        res.status(401).json({ error: "Unauthorized" });
    }
});
```

Chain berhenti otomatis begitu response selesai dikirim (`res.writableEnded`), jadi handler berikutnya tidak dipanggil.

> Jika path tidak cocok dengan route mana pun, hanya middleware global (tanpa path) yang dijalankan sebelum respons 404 dikirim.

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

> Isi sub-router disalin saat `use()` dipanggil. Daftarkan semua route ke sub-router **sebelum** di-mount; route yang ditambahkan setelahnya tidak ikut. Sub-router yang sama boleh di-mount di beberapa path.

## Error Handling

Handler dengan **tiga argumen** `(err, req, res)` dikenali sebagai error handler. Dipanggil saat handler atau middleware melempar error (sync maupun async).

```js
app.get("/boom", () => {
    throw new Error("Something broke");
});

app.use((err, req, res) => {
    res.status(err.statusCode || 500).json({ error: { message: err.message } });
});
```

> Deteksi error handler memakai `handler.length === 3`. Jangan memakai default parameter atau rest parameter di signature handler, karena mengubah `length`.

### Menentukan status code

Status code diambil dari properti `statusCode` pada error. Tanpa properti itu, hasilnya `500`.

```js
app.get("/admin", () => {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
});
```

> `res.statusCode` atau `res.status()` yang diset **sebelum** error dilempar tidak dipakai oleh respons default. Gunakan `err.statusCode`, atau tangani sendiri di error handler.

### Respons default

Jika tidak ada handler yang mengirim response, router mengirim JSON otomatis:

```json
{ "error": { "message": "Not Found" } }
```

- Tidak ada route cocok: `404 Not Found`
- Error dengan `statusCode`: status tersebut dipakai
- Error tanpa `statusCode`: `500`
- Jika error handler sendiri melempar error, error baru dibuat dengan `cause` menunjuk error asli
- Field `stack` hanya disertakan saat `NODE_ENV=development`

## Timeout

Aktifkan lewat opsi `requestTimeout` (milidetik) pada `App`. Jika seluruh chain handler melebihi waktu tersebut, error `504 Gateway Timeout` dilempar dan diteruskan ke error handler.

```js
const app = new App({ requestTimeout: 5000 });
```

- Tanpa opsi `requestTimeout` (atau bernilai `0`), tidak ada batas waktu
- Handler yang sudah berjalan tidak dihentikan paksa. Tetapi setelah response dikirim, `res.json()` dan `res.send()` mengabaikan penulisan berikutnya, dan handler selanjutnya di chain tidak dipanggil

### `req.signal`

Saat `requestTimeout` aktif, `req.signal` adalah `AbortSignal` yang di-abort ketika timeout terjadi (reason-nya error 504) atau ketika salah satu handler melempar error (reason-nya error tersebut). Teruskan ke operasi yang mendukungnya agar pekerjaan ikut dibatalkan:

```js
app.get("/proxy", async (req, res) => {
    const upstream = await fetch("https://example.com/api", { signal: req.signal });
    res.json(await upstream.json());
});
```

`req.signal` bernilai `undefined` jika `requestTimeout` tidak diaktifkan.

## Request

| Properti | Keterangan |
| --- | --- |
| `req.path` | Pathname tanpa query string |
| `req.query` | Object query string, di-parse secara lazy. Key yang berulang menjadi array, dan `+` di-decode menjadi spasi |
| `req.params` | Parameter dari route dinamis (sudah di-decode). Wildcard `*` ada di `req.params[0]` |
| `req.body` | Hasil parse body (butuh middleware `json()`) |
| `req.signal` | `AbortSignal` yang di-abort saat timeout atau error handler (hanya jika `requestTimeout` aktif) |

```js
// GET /search?tag=a&tag=b&page=2
app.get("/search", (req, res) => {
    res.json(req.query); // { tag: ["a", "b"], page: "2" }
});
```

`req.query` dan `req.params` yang sampai ke handler memakai object tanpa prototype, jadi gunakan `Object.hasOwn(req.query, "key")` atau `"key" in req.query`, bukan `req.query.hasOwnProperty(...)`.

`Request` adalah turunan `http.IncomingMessage`, jadi `req.headers`, `req.method`, dan lainnya tetap tersedia.

## Response

| Method | Keterangan |
| --- | --- |
| `res.status(code)` | Set status code, mengembalikan `res` sehingga bisa di-chain |
| `res.send(chunk)` | Kirim response dan akhiri |
| `res.json(value)` | Set `Content-Type: application/json`, serialize, lalu kirim |

```js
res.status(201).json({ created: true });
```

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
        origin: ["https://example.com", "https://app.example.com"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        headers: ["Content-Type", "Authorization"],
        maxAge: 600,
    }),
);
```

| Opsi | Default | Keterangan |
| --- | --- | --- |
| `origin` | `"*"` | `"*"`, satu origin, array origin, atau `null` |
| `credentials` | `false` | Mengirim `Access-Control-Allow-Credentials: true` |
| `headers` | - | `"*"` atau array nama header (tidak membedakan huruf besar/kecil) |
| `methods` | - | `"*"` atau array nama method (tidak membedakan huruf besar/kecil) |
| `maxAge` | `0` | Lama cache preflight (detik). `0` berarti header tidak dikirim |

Perilaku:

- Request `OPTIONS` dijawab langsung dengan `204` dan chain berhenti
- Origin dicocokkan **persis sama** (case-sensitive) dengan header `Origin` dari request. Jika cocok, origin tersebut dipantulkan, dan header `Vary: Origin` ditambahkan pada request non-preflight
- `Access-Control-Allow-Headers` dan `Access-Control-Allow-Methods` hanya dikirim pada preflight, dan hanya jika **semua** header atau method yang diminta ada di daftar
- Nilai `"*"` untuk `headers` dan `methods` diabaikan saat `credentials: true`, sesuai spesifikasi CORS
- Pada request non-preflight, `headers` (jika array) dikirim sebagai `Access-Control-Expose-Headers`

> `origin: "*"` bersama `credentials: true` memantulkan **semua** origin dengan credentials. Pakai hanya untuk development; di production sebutkan origin secara eksplisit.

## Opsi

```js
const app = new App({ cacheSize: 1000, requestTimeout: 5000 });
```

| Opsi | Default | Keterangan |
| --- | --- | --- |
| `cacheSize` | `1000` | Jumlah maksimum entri LRU cache untuk hasil lookup `METHOD path`. Cache dikosongkan setiap ada route baru didaftarkan |
| `requestTimeout` | `0` | Batas waktu handler dalam ms (khusus `App`). Lihat bagian [Timeout](#timeout) |

`Router` hanya menerima `cacheSize`.

## API

### `new App([options])` / `new Router([options])`

Membuat instance baru. `App` adalah `Router` ditambah `listen()` dan dukungan `requestTimeout`.

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

## Testing

```bash
npm test
```

## Lisensi

MIT
