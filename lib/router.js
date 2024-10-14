const http = require("http");
const { Readable } = require("stream");

/**
 * Kelas untuk menangani routing dalam aplikasi HTTP.
 */
class Router {
    routes = [];

    constructor() {}

    /**
     * Menambahkan rute baru ke router.
     *
     * @param {string} method - Metode HTTP (GET, POST, dll).
     * @param {string} path - Jalur untuk rute.
     * @param {...function} middlewares - Middleware yang akan diterapkan pada rute.
     */
    add(method, path, ...middlewares) {
        if (typeof path === "function") {
            middlewares = [path, ...middlewares];
            path = "*";
        }
        const [{ routes }] = middlewares;
        if (routes) {
            middlewares = [];
            for (const route of routes) {
                this.add(route.method, path + route.path, ...route.middlewares);
            }
        }
        path = path.replace(/(?!^)\/$/, "");
        const pattern = `^${path.replace(/:(\w+)/g, "(?<$1>[^/]+)").replace(/\*/, "(?:.*)")}(?:\$)`;
        const regexp = new RegExp(pattern, "i");
        this.routes.push({ method, path, middlewares, regexp });
    }

    /**
     * Menambahkan middleware global untuk semua rute.
     *
     * @param {...function} args - Middleware yang akan diterapkan.
     */
    use(...args) {
        this.add("", ...args);
    }

    /**
     * Menambahkan rute POST.
     *
     * @param {...*} args - Argumen untuk rute POST.
     */
    post(...args) {
        this.add("POST", ...args);
    }

    /**
     * Menambahkan rute GET.
     *
     * @param {...*} args - Argumen untuk rute GET.
     */
    get(...args) {
        this.add("GET", ...args);
    }

    /**
     * Menambahkan rute PATCH.
     *
     * @param {...*} args - Argumen untuk rute PATCH.
     */
    patch(...args) {
        this.add("PATCH", ...args);
    }

    /**
     * Menambahkan rute DELETE.
     *
     * @param {...*} args - Argumen untuk rute DELETE.
     */
    delete(...args) {
        this.add("DELETE", ...args);
    }

    /**
     * Menambahkan rute PUT.
     *
     * @param {...*} args - Argumen untuk rute PUT.
     */
    put(...args) {
        this.add("PUT", ...args);
    }

    /**
     * Menangani permintaan HTTP dan menjalankan middleware yang sesuai.
     *
     * @param {http.IncomingMessage} req - Objek permintaan dari klien.
     * @param {http.ServerResponse} res - Objek respons untuk dikirim kembali ke klien.
     */
    async handleRequest(req, res) {
        try {
            req.protocol_ = req.socket.encrypted ? "https:" : "http:";
            req.host_ = req.headers.host;
            req.url_ = new URL(`${req.protocol_}//${req.host_}${req.url}`);
            req.remoteAddress_ = req.socket.remoteAddress;
            req.pathname_ = req.url_.pathname;
            req.query = {};
            res.locals={}
            for (const [name, value] of req.url_.searchParams) {
                if (req.query[name]) {
                    if (Array.isArray(req.query[name])) {
                        req.query[name].push(value);
                    } else {
                        req.query[name] = [req.query[name], value];
                    }
                } else {
                    req.query[name] = value;
                }
            }
            res.send = (body) => {
                if (typeof body === "string") {
                    const readable = new Readable();
                    readable.push(body);
                    readable.push(null);
                    body = readable;
                }
                body.pipe(res);
            };
            res.json = (body) => {
                res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify(body));
            };
            for (const route of this.routes) {
                const matches = req.url_.pathname.match(route.regexp);
                if (!matches || (route.method !== req.method && route.method !== "")) {
                    continue;
                }
                req.params = { ...matches?.groups };
                for (const middleware of route.middlewares) {
                    if (req.error_ && middleware.length !== 4) {
                        continue;
                    }
                    try {
                        await new Promise((resolve, reject) => {
                            const next = (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            };
                            if (req.error_) {
                                middleware(req.error_, req, res, next);
                            } else {
                                middleware(req, res, next);
                            }
                        });
                    } catch (error) {
                        req.error_ = error;
                    }
                }
            }
            if (req.error_) {
                throw req.error_;
            }
            res.statusCode = 404;
            res.json({ message: http.STATUS_CODES[res.statusCode] });
        } catch (error) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                res.statusCode = 500;
            }
            error = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));
            res.json(error);
        }
    }

    /**
     * Memulai server dan mendengarkan permintaan pada port yang ditentukan.
     *
     * @param {...*} args - Argumen untuk mendengarkan server.
     * @returns {http.Server} - Instance server.
     */
    listen(...args) {
        const server = http.createServer(this.handleRequest.bind(this));
        server.listen(...args);
        return server;
    }
}

module.exports = Router;

// {
//     const app = new Router()
//     // get|post|patch|delete|put|use
//     app.get('/',(req,res)=>{
//         res.send('ok')
//     })
//     app.get('/json',(req,res)=>{
//         res.json({message:'ok'})
//     })
//     app.listen(3000)

//     // test
//     fetch('http://localhost:3000')
//     .then(res=>res.text())
//     .then(console.log)
//     .catch(console.log)
//     // test
//     fetch('http://localhost:3000/json')
//     .then(res=>res.text())
//     .then(console.log)
//     .catch(console.log)
// }
