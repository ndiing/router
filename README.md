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
