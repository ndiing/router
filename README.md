<a name="module_middleware"></a>

## middleware

* [middleware](#module_middleware)
    * [.security()](#module_middleware.security) ⇒ <code>function</code>
    * [.cors()](#module_middleware.cors) ⇒ <code>function</code>
    * [.cookies()](#module_middleware.cookies) ⇒ <code>function</code>
    * [.compression()](#module_middleware.compression) ⇒ <code>function</code>
    * [.messages()](#module_middleware.messages) ⇒ <code>function</code>
    * [.auth(permissions)](#module_middleware.auth) ⇒ <code>function</code>
    * [.missing()](#module_middleware.missing) ⇒ <code>function</code>
    * [.catchAll(err)](#module_middleware.catchAll) ⇒ <code>function</code>

<a name="module_middleware.security"></a>

### middleware.security() ⇒ <code>function</code>
Middleware untuk menambahkan header keamanan pada respons HTTP.
Header yang ditambahkan meliputi:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Content-Security-Policy
- Strict-Transport-Security
- Referrer-Policy

**Kind**: static method of [<code>middleware</code>](#module_middleware)  
**Returns**: <code>function</code> - Middleware Express untuk menambahkan header keamanan.  
<a name="module_middleware.cors"></a>

### middleware.cors() ⇒ <code>function</code>
Middleware untuk menangani Cross-Origin Resource Sharing (CORS).
Mengatur header CORS seperti:
- Access-Control-Allow-Origin
- Access-Control-Allow-Methods
- Access-Control-Allow-Headers
- Access-Control-Allow-Credentials

**Kind**: static method of [<code>middleware</code>](#module_middleware)  
**Returns**: <code>function</code> - Middleware Express untuk menangani CORS.  
<a name="module_middleware.cookies"></a>

### middleware.cookies() ⇒ <code>function</code>
Middleware untuk memparsing cookie dari permintaan HTTP dan memungkinkan pengaturan cookie dalam respons.

**Kind**: static method of [<code>middleware</code>](#module_middleware)  
**Returns**: <code>function</code> - Middleware Express untuk menangani cookie.  
<a name="module_middleware.compression"></a>

### middleware.compression() ⇒ <code>function</code>
Middleware untuk mengompresi respons HTTP menggunakan Brotli, gzip, atau deflate.
Menyesuaikan dengan header "Accept-Encoding" dari permintaan.

**Kind**: static method of [<code>middleware</code>](#module_middleware)  
**Returns**: <code>function</code> - Middleware Express untuk mengompresi respons.  
<a name="module_middleware.messages"></a>

### middleware.messages() ⇒ <code>function</code>
Middleware untuk memparsing isi dari body permintaan POST, PATCH, atau PUT.
Mendukung parsing untuk content-type "application/json" dan "application/x-www-form-urlencoded".

**Kind**: static method of [<code>middleware</code>](#module_middleware)  
**Returns**: <code>function</code> - Middleware Express untuk menangani body dari permintaan.  
<a name="module_middleware.auth"></a>

### middleware.auth(permissions) ⇒ <code>function</code>
Middleware untuk mengatur autentikasi berdasarkan izin yang diberikan.
Memeriksa token Bearer di header Authorization.

**Kind**: static method of [<code>middleware</code>](#module_middleware)  
**Returns**: <code>function</code> - Middleware Express untuk menangani autentikasi.  

| Param | Type | Description |
| --- | --- | --- |
| permissions | <code>Array.&lt;Object&gt;</code> | Daftar izin yang memperbolehkan akses berdasarkan path, metode, dan alamat IP. |

<a name="module_middleware.missing"></a>

### middleware.missing() ⇒ <code>function</code>
Middleware untuk menangani rute yang tidak ditemukan (404).

**Kind**: static method of [<code>middleware</code>](#module_middleware)  
**Returns**: <code>function</code> - Middleware Express untuk menangani kesalahan 404.  
<a name="module_middleware.catchAll"></a>

### middleware.catchAll(err) ⇒ <code>function</code>
Middleware untuk menangani semua error yang tidak tertangani.
Mengembalikan error dalam bentuk JSON.

**Kind**: static method of [<code>middleware</code>](#module_middleware)  
**Returns**: <code>function</code> - Middleware Express untuk menangani error.  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>Error</code> | Objek error yang terjadi. |

