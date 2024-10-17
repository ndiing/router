## Classes

<dl>
<dt><a href="#Router">Router</a></dt>
<dd><p>Kelas untuk menangani routing dalam aplikasi HTTP.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#compression">compression()</a> ⇒ <code>function</code></dt>
<dd><p>Middleware untuk kompresi respons berdasarkan header &#39;Accept-Encoding&#39;.</p>
</dd>
<dt><a href="#messages">messages()</a> ⇒ <code>function</code></dt>
<dd><p>Middleware untuk mem-parsing body permintaan pada metode POST, PATCH, dan PUT.</p>
</dd>
<dt><a href="#cookies">cookies()</a> ⇒ <code>function</code></dt>
<dd><p>Middleware untuk mengelola cookie dalam permintaan dan respons.</p>
</dd>
<dt><a href="#security">security()</a> ⇒ <code>function</code></dt>
<dd><p>Middleware untuk menambahkan header keamanan pada respons.</p>
</dd>
<dt><a href="#cors">cors()</a> ⇒ <code>function</code></dt>
<dd><p>Middleware untuk menangani permintaan CORS.</p>
</dd>
<dt><a href="#authorization">authorization()</a> ⇒ <code>function</code></dt>
<dd><p>Middleware untuk mengelola otorisasi akses berdasarkan IP dan token.</p>
</dd>
<dt><a href="#fallback">fallback()</a> ⇒ <code>function</code></dt>
<dd><p>Middleware untuk mengembalikan respons 404 jika tidak ditemukan.</p>
</dd>
<dt><a href="#catchAll">catchAll(err, req, res, next)</a></dt>
<dd><p>Middleware untuk menangani kesalahan.</p>
</dd>
</dl>

<a name="Router"></a>

## Router

Kelas untuk menangani routing dalam aplikasi HTTP.

**Kind**: global class

-   [Router](#Router)
    -   [.add(method, path, ...middlewares)](#Router+add)
    -   [.use(...args)](#Router+use)
    -   [.post(...args)](#Router+post)
    -   [.get(...args)](#Router+get)
    -   [.patch(...args)](#Router+patch)
    -   [.delete(...args)](#Router+delete)
    -   [.put(...args)](#Router+put)
    -   [.handleRequest(req, res)](#Router+handleRequest)
    -   [.listen(...args)](#Router+listen) ⇒ <code>http.Server</code>

<a name="Router+add"></a>

### router.add(method, path, ...middlewares)

Menambahkan rute baru ke router.

**Kind**: instance method of [<code>Router</code>](#Router)

| Param          | Type                  | Description                                |
| -------------- | --------------------- | ------------------------------------------ |
| method         | <code>string</code>   | Metode HTTP (GET, POST, dll).              |
| path           | <code>string</code>   | Jalur untuk rute.                          |
| ...middlewares | <code>function</code> | Middleware yang akan diterapkan pada rute. |

<a name="Router+use"></a>

### router.use(...args)

Menambahkan middleware global untuk semua rute.

**Kind**: instance method of [<code>Router</code>](#Router)

| Param   | Type                  | Description                      |
| ------- | --------------------- | -------------------------------- |
| ...args | <code>function</code> | Middleware yang akan diterapkan. |

<a name="Router+post"></a>

### router.post(...args)

Menambahkan rute POST.

**Kind**: instance method of [<code>Router</code>](#Router)

| Param   | Type            | Description              |
| ------- | --------------- | ------------------------ |
| ...args | <code>\*</code> | Argumen untuk rute POST. |

<a name="Router+get"></a>

### router.get(...args)

Menambahkan rute GET.

**Kind**: instance method of [<code>Router</code>](#Router)

| Param   | Type            | Description             |
| ------- | --------------- | ----------------------- |
| ...args | <code>\*</code> | Argumen untuk rute GET. |

<a name="Router+patch"></a>

### router.patch(...args)

Menambahkan rute PATCH.

**Kind**: instance method of [<code>Router</code>](#Router)

| Param   | Type            | Description               |
| ------- | --------------- | ------------------------- |
| ...args | <code>\*</code> | Argumen untuk rute PATCH. |

<a name="Router+delete"></a>

### router.delete(...args)

Menambahkan rute DELETE.

**Kind**: instance method of [<code>Router</code>](#Router)

| Param   | Type            | Description                |
| ------- | --------------- | -------------------------- |
| ...args | <code>\*</code> | Argumen untuk rute DELETE. |

<a name="Router+put"></a>

### router.put(...args)

Menambahkan rute PUT.

**Kind**: instance method of [<code>Router</code>](#Router)

| Param   | Type            | Description             |
| ------- | --------------- | ----------------------- |
| ...args | <code>\*</code> | Argumen untuk rute PUT. |

<a name="Router+handleRequest"></a>

### router.handleRequest(req, res)

Menangani permintaan HTTP dan menjalankan middleware yang sesuai.

**Kind**: instance method of [<code>Router</code>](#Router)

| Param | Type                              | Description                                   |
| ----- | --------------------------------- | --------------------------------------------- |
| req   | <code>http.IncomingMessage</code> | Objek permintaan dari klien.                  |
| res   | <code>http.ServerResponse</code>  | Objek respons untuk dikirim kembali ke klien. |

<a name="Router+listen"></a>

### router.listen(...args) ⇒ <code>http.Server</code>

Memulai server dan mendengarkan permintaan pada port yang ditentukan.

**Kind**: instance method of [<code>Router</code>](#Router)  
**Returns**: <code>http.Server</code> - - Instance server.

| Param   | Type            | Description                        |
| ------- | --------------- | ---------------------------------- |
| ...args | <code>\*</code> | Argumen untuk mendengarkan server. |

<a name="compression"></a>

## compression() ⇒ <code>function</code>

Middleware untuk kompresi respons berdasarkan header 'Accept-Encoding'.

**Kind**: global function  
**Returns**: <code>function</code> - Middleware yang melakukan kompresi respons.  
<a name="messages"></a>

## messages() ⇒ <code>function</code>

Middleware untuk mem-parsing body permintaan pada metode POST, PATCH, dan PUT.

**Kind**: global function  
**Returns**: <code>function</code> - Middleware yang mem-parsing body permintaan.  
<a name="cookies"></a>

## cookies() ⇒ <code>function</code>

Middleware untuk mengelola cookie dalam permintaan dan respons.

**Kind**: global function  
**Returns**: <code>function</code> - Middleware yang mengelola cookie.  
<a name="security"></a>

## security() ⇒ <code>function</code>

Middleware untuk menambahkan header keamanan pada respons.

**Kind**: global function  
**Returns**: <code>function</code> - Middleware yang menambahkan header keamanan.  
<a name="cors"></a>

## cors() ⇒ <code>function</code>

Middleware untuk menangani permintaan CORS.

**Kind**: global function  
**Returns**: <code>function</code> - Middleware yang mengatur header CORS.  
<a name="authorization"></a>

## authorization() ⇒ <code>function</code>

Middleware untuk mengelola otorisasi akses berdasarkan IP dan token.

**Kind**: global function  
**Returns**: <code>function</code> - Middleware yang mengatur otorisasi.  
<a name="fallback"></a>

## fallback() ⇒ <code>function</code>

Middleware untuk mengembalikan respons 404 jika tidak ditemukan.

**Kind**: global function  
**Returns**: <code>function</code> - Middleware yang mengatur respons 404.  
<a name="catchAll"></a>

## catchAll(err, req, res, next)

Middleware untuk menangani kesalahan.

**Kind**: global function

| Param | Type                  | Description                                        |
| ----- | --------------------- | -------------------------------------------------- |
| err   | <code>Error</code>    | Kesalahan yang ditangkap.                          |
| req   | <code>Object</code>   | Objek permintaan.                                  |
| res   | <code>Object</code>   | Objek respons.                                     |
| next  | <code>function</code> | Fungsi untuk melanjutkan ke middleware berikutnya. |
