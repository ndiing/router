# @ndiinginc/router

Router HTTP kecil, cepat, dan **zero-dependency** untuk Node.js. Dibangun langsung di atas `node:http`, dengan routing berbasis tree, nested router, middleware async, error handler, timeout per request, serta middleware `json` dan `cors` bawaan.

## Fitur

- Zero dependency, murni `node:http`
- Routing berbasis tree per segmen: static, lalu `:param`, lalu wildcard `*`, dengan backtracking
- Parameter dinamis `:id` dan wildcard `*` yang menangkap sisa path
- Nested router dengan `use(path, router)`
- Middleware global dan per-path, mendukung `async`
- Error handler dengan signature `(err, req, res)`
- Timeout per request, dengan `req.controller` (`AbortController`) untuk pembatalan kooperatif
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

| Export       | Keterangan                               |
| ------------ | ---------------------------------------- |
| `App`        | Router + HTTP server (`listen`)          |
| `App.Router` | Router tanpa server, untuk nested router |
| `App.json`   | Middleware JSON body parser              |
| `App.cors`   | Middleware CORS                          |

## Routing

Semua method mengembalikan `this`, jadi bisa di-chain.

```js
app.get("/users", handler).post("/users", handler).put("/users/:id", handler).patch("/users/:id", handler).delete("/users/:id", handler);
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

Beberapa parameter dengan nama berbeda boleh ada di level yang sama. Router mencoba semuanya sesuai urutan pendaftaran, dan memakai yang cocok sampai akhir path:

```js
app.get("/users/:id", handler);
app.get("/users/:userId/posts", handler);
// GET /users/5/posts -> req.params.userId === "5"
```

### Wildcard

Segmen `*` menangkap **seluruh sisa path** (termasuk `/`) dan nilainya tersedia di `req.params.wildcard`.

```js
app.get("/files/*", (req, res) => {
    res.json({ file: req.params.wildcard });
});

// GET /files/images/logo.png -> { file: "images/logo.png" }
```

Wildcard butuh minimal satu segmen tersisa, jadi `/files/*` tidak cocok dengan `/files`.

### Aturan matching

- Di setiap level, router mencoba **static dulu, lalu parameter (sesuai urutan pendaftaran), lalu wildcard**. Jadi `/users/me` menang atas `/users/:id` bila keduanya terdaftar.
- Jika sebuah cabang gagal di tengah jalan, router mundur (backtrack) dan mencoba cabang berikutnya.
- Pemilihan cabang memperhatikan method. Jika route static tidak punya handler untuk method request, router mencoba cabang parameter atau wildcard. Contoh: dengan `GET /users/me` dan `PUT /users/:id`, request `PUT /users/me` ditangani oleh `PUT /users/:id`.
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

> Jika tidak ada route yang cocok sepenuhnya, middleware pada bagian path yang cocok paling dalam tetap dijalankan sebelum respons 404. Contohnya, middleware `/admin` tetap jalan untuk `/admin/tidak-ada`, begitu juga middleware global.

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

> Deteksi error handler memakai `handler.length === 3`. Jangan memakai default parameter atau rest parameter di signature handler, karena mengubah `length`.

### Menentukan status code

Status code diambil dari `res.statusCode`. Set sebelum melempar error:

```js
app.get("/admin", (req, res) => {
    res.status(403);
    throw new Error("Forbidden");
});
```

Jika `res.statusCode` masih di bawah 400 saat error ditangani, hasilnya `500`. Properti `statusCode` pada objek error tidak dipakai.

### Error handler sendiri

Di error handler, `res.statusCode` masih bernilai awal (`200`) bila error dilempar tanpa mengatur status, jadi atur sendiri:

```js
app.use((err, req, res) => {
    const status = res.statusCode >= 400 ? res.statusCode : 500;
    res.status(status).json({ error: { message: err.message } });
});
```

### Respons default

Jika tidak ada handler yang mengirim response, router mengirim JSON otomatis:

```json
{ "error": { "message": "Not Found" } }
```

- Tidak ada route cocok: `404 Not Found`
- `res.statusCode` sudah `>= 400`: dipakai apa adanya
- `res.statusCode` masih `< 400`: diganti `500`
- Jika error handler sendiri melempar error, error baru dibuat dengan `cause` menunjuk error asli
- Field `stack` hanya disertakan saat `NODE_ENV=development`

## Timeout

Aktifkan lewat opsi `requestTimeout` (milidetik) pada `App`. Jika seluruh chain handler melebihi waktu tersebut, `res.statusCode` diset `504` dan error `Gateway Timeout` dilempar ke error handler.

```js
const app = new App({ requestTimeout: 5000 });
```

- Tanpa opsi `requestTimeout` (atau bernilai `0`), tidak ada batas waktu
- Handler yang sudah berjalan tidak dihentikan paksa. Setelah response dikirim, handler berikutnya di chain tidak dipanggil, dan error yang dilempar handler setelah timeout hanya dicatat lewat `console.error`

### `req.controller`

`req.controller` adalah `AbortController` milik request (dibuat saat pertama kali diakses). Saat `requestTimeout` aktif, `req.controller.signal` di-abort ketika timeout terjadi atau ketika salah satu handler melempar error; reason-nya adalah error terkait. Teruskan signal ke operasi yang mendukungnya agar pekerjaan ikut dibatalkan:

```js
app.get("/proxy", async (req, res) => {
    const upstream = await fetch("https://example.com/api", {
        signal: req.controller.signal,
    });
    res.json(await upstream.json());
});
```

## Request

| Properti         | Keterangan                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `req.path`       | Pathname tanpa query string                                                                                 |
| `req.query`      | Object query string, di-parse secara lazy. Key yang berulang menjadi array, dan `+` di-decode menjadi spasi |
| `req.params`     | Parameter dari route dinamis (sudah di-decode). Wildcard `*` ada di `req.params.wildcard`                   |
| `req.body`       | Hasil parse body (butuh middleware `json()`)                                                                |
| `req.controller` | `AbortController` untuk request ini. Di-abort saat timeout atau error handler (jika `requestTimeout` aktif) |

```js
// GET /search?tag=a&tag=b&page=2
app.get("/search", (req, res) => {
    res.json(req.query); // { tag: ["a", "b"], page: "2" }
});
```

`req.query` dan `req.params` memakai object tanpa prototype, jadi gunakan `Object.hasOwn(req.query, "key")` atau `"key" in req.query`, bukan `req.query.hasOwnProperty(...)`.

`Request` adalah turunan `http.IncomingMessage`, jadi `req.headers`, `req.method`, dan lainnya tetap tersedia.

## Response

| Method             | Keterangan                                                                 |
| ------------------ | -------------------------------------------------------------------------- |
| `res.status(code)` | Set status code, mengembalikan `res` sehingga bisa di-chain                |
| `res.send(chunk)`  | Kirim response dan akhiri                                                  |
| `res.json(value)`  | Set `Content-Type: application/json; charset=utf-8`, serialize, lalu kirim |

```js
res.status(201).json({ created: true });
```

`res.send()` dan `res.json()` tidak melakukan apa-apa jika response sudah selesai dikirim. `Response` adalah turunan `http.ServerResponse`, jadi `res.statusCode`, `res.setHeader()`, dan lainnya tetap tersedia.

## Middleware Bawaan

### `json([options])`

```js
app.use(App.json({ limit: 100 * 1024 })); // default 100 KB
```

| Opsi    | Default  | Keterangan                      |
| ------- | -------- | ------------------------------- |
| `limit` | `102400` | Ukuran body maksimum dalam byte |

Perilaku:

- Hanya memproses method `POST`, `PUT`, `PATCH`, dan `QUERY` dengan `Content-Type: application/json`
- Body melebihi `limit` menghasilkan `413` (dicek lewat `Content-Length` dan saat streaming)
- JSON tidak valid menghasilkan `400`, dengan error asli di `cause`
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

| Opsi          | Default | Keterangan                                                                                                    |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `origin`      | `"*"`   | `"*"`, satu origin, atau array origin. `null` tidak mengirim header `Access-Control-Allow-Origin` sama sekali |
| `credentials` | `false` | Mengirim `Access-Control-Allow-Credentials: true`                                                             |
| `headers`     | -       | `"*"` atau array nama header (tidak membedakan huruf besar/kecil)                                             |
| `methods`     | -       | `"*"` atau array nama method (tidak membedakan huruf besar/kecil)                                             |
| `maxAge`      | `0`     | Lama cache preflight (detik). `0` berarti header tidak dikirim                                                |

Perilaku:

- **Preflight** adalah request `OPTIONS` dengan header `Access-Control-Request-Method`. Preflight dijawab langsung dengan `204` dan chain berhenti. `OPTIONS` biasa diteruskan ke handler berikutnya
- Origin dicocokkan **persis sama** (case-sensitive) dengan header `Origin` dari request. Jika cocok, origin tersebut dipantulkan dan header `Vary: Origin` ditambahkan
- `Access-Control-Allow-Headers`: jika `headers` berupa array, header hanya dikirim bila **semua** header yang diminta ada di daftar
- `Access-Control-Allow-Methods`: jika `methods` berupa array, header hanya dikirim bila method yang diminta ada di daftar
- Jika `headers` atau `methods` tidak diisi, nilai yang diminta di preflight dipantulkan apa adanya
- `"*"` untuk `headers` dan `methods` hanya dikirim sebagai `*` bila `credentials: false`. Dengan `credentials: true`, nilainya diperlakukan seperti tidak diisi (dipantulkan)
- Pada request non-preflight, `headers` (jika array atau `"*"`) dikirim sebagai `Access-Control-Expose-Headers`

> `origin: "*"` bersama `credentials: true` memantulkan **semua** origin dengan credentials. Pakai hanya untuk development; di production sebutkan origin secara eksplisit.

## Opsi

```js
const app = new App({ requestTimeout: 5000 });
```

| Opsi             | Default | Keterangan                                                                    |
| ---------------- | ------- | ----------------------------------------------------------------------------- |
| `requestTimeout` | `0`     | Batas waktu handler dalam ms (khusus `App`). Lihat bagian [Timeout](#timeout) |

`Router` tidak memiliki opsi sendiri; `requestTimeout` hanya dipakai oleh `App`.

## API

### `new App([options])` / `new Router([options])`

Membuat instance baru. `App` adalah `Router` ditambah `listen()` dan dukungan `requestTimeout`.

### `router.use([path], ...handlers | router)`

Mendaftarkan middleware, error handler, atau nested router untuk semua method.

### `router.<method>([path], ...handlers)`

Mendaftarkan handler untuk method tertentu. `path` opsional; jika dihilangkan, handler dipasang di root.

### `router.find(method, path)`

Mencari route tanpa menjalankannya. Berguna untuk testing.

```js
const { matched, params, paramsLength, handlers, errorHandlers } = app.find("GET", "/users/1");
```

### `app.listen(...args)`

Membuat `http.Server` dengan `Request` dan `Response` milik router, lalu memanggil `server.listen(...args)`. Mengembalikan instance `http.Server`.

```js
const server = app.listen(0); // port acak
console.log(server.address().port);
```

### Server sendiri

`App.SERVER_OPTIONS` berisi opsi `IncomingMessage` dan `ServerResponse` yang dipakai `listen()`. Jika ingin membuat server sendiri (misalnya HTTPS), sertakan opsi itu dan panggil `app.handle(req, res)`:

```js
const https = require("https");

const server = https.createServer({ ...App.SERVER_OPTIONS, key, cert }, (req, res) => app.handle(req, res));
server.listen(443);
```

## Benchmark

Hello world dengan satu route `GET /`, diuji memakai `autocannon -c 100 -d 40 -p 10` di mesin lokal.

|                       | Req/sec (avg) | Latency (avg) |
| --------------------- | ------------- | ------------- |
| Fastify               | 31.475        | 31,27 ms      |
| **@ndiinginc/router** | 29.735        | 33,12 ms      |
| Express               | 20.211        | 48,93 ms      |

Hasil bervariasi tergantung mesin, versi Node.js, dan jumlah route. Benchmark ini hanya menggambarkan overhead dasar, bukan performa aplikasi nyata.

## Testing

```bash
npm test
```

## Lisensi

MIT
