const http = require("http");
const zlib = require("zlib");
const { Readable } = require("stream");
const { URL2, Headers } = require("@ndiinginc/fetch");
const Crypto = require("@ndiinginc/crypto");

class Router {
    routes = [];

    constructor(routes = []) {
        this.handleRequest = this.handleRequest.bind(this);
        for (let i = 0; i < routes.length; i++) {
            const { method = ".*", path = ".*", callback = [] } = routes[i];
            this.add({ method, path, callback });
        }

        const methods = ["POST", "GET", "PATCH", "PUT", "DELETE"];

        for (let i = 0; i < methods.length; i++) {
            const method = methods[i];
            this[method.toLowerCase()] = (...args) => {
                this.add(method, ...args);
            };
        }
    }

    add(method, path, ...callback) {
        if (typeof method == "object") {
            ({ method, path, callback } = method);
        }
        if (!Array.isArray(callback)) {
            callback = [callback];
        }
        if (typeof path == "function") {
            callback = [path, ...callback];
            path = ".*";
        }
        const [{ routes }] = callback;
        if (routes) {
            callback = [];
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                route.path = path + route.path;
                this.add(route);
            }
        } else {
            let regexp = path;
            regexp = regexp.replace(/\:(\w+)/g, "(?<$1>[^/]+)").replace(/\/?$/, "/?$");
            regexp = new RegExp("^" + regexp, "i");
            this.routes.push({ method, path, callback, regexp });
        }
    }

    use(...args) {
        this.add(".*", ...args);
    }

    async beforeRequest(req, res) {
        req.headers = new Headers(req.headers);
        req.url2 = new URL2(req.url);
        req.path = req.url2.pathname;
        req.query = req.url2.searchParams;
        // req.params = {}; 
        req.cookies = {};
        if (req.headers.has("cookie")) {
            for (const [, name, value] of req.headers.get("cookie").matchAll(/([^\=;]+)\=([^\=;]+)?(; |$)/g)) {
                req.cookies[name] = value;
            }
        }

        // req.body = {};
        if (!/(GET|HEAD|DELETE)/.test(req.method)) {
            let buffer = [];
            for await (const chunk of req) {
                buffer.push(chunk);
            }
            buffer = Buffer.concat(buffer);
            const type = req.headers.get("content-type");
            if (/json/.test(type)) {
                req.body = JSON.parse(buffer);
            } else {
                req.body = "" + buffer;
            }
        }
    }

    beforeResponse(req, res) {
        res.headers = {
            "Content-Security-Policy": "default-src 'self'",
            "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Access-Control-Allow-Origin": "*",
            "Content-Language": "en-US",
            "X-Powered-By": "Ndiing",
            ...res.headers,
        };
        res.headers = new Headers(res.headers);
        res.status = res.statusCode;

        res.send = (value = "") => {
            const hash = Crypto.hash(value, { algorithm: "sha1" });
            const etag = `W/"${hash}"`;
            res.headers.set("etag", etag);

            if (req.headers.get("if-none-match") == etag) {
                res.status = 304;
                value = "";
            }

            let readable = value;
            if (!(value instanceof Readable)) {
                readable = new Readable();
                readable.push(value);
                readable.push(null);
            }

            const encoding = req.headers.get("accept-encoding");
            if (/\bgzip\b/.test(encoding)) {
                res.headers.set("content-encoding", "gzip");
                readable = readable.pipe(zlib.createGzip());
            } else if (/\bdeflate\b/.test(encoding)) {
                res.headers.set("content-encoding", "deflate");
                readable = readable.pipe(zlib.createDeflate());
            } else if (/\bbr\b/.test(encoding)) {
                res.headers.set("content-encoding", "br");
                readable = readable.pipe(zlib.createBrotliCompress());
            }
            if (value && !res.headers.has("content-type")) {
                res.headers.set("content-type", "text/html");
            }

            res.writeHead(res.status, res.headers.entries());
            readable.pipe(res);
        };

        res.json = (value = {}) => {
            res.headers.set("content-type", "application/json");
            res.send(JSON.stringify(value));
        };

        res.redirect = (url, status = 301) => {
            if (status) {
                res.status = status;
            }
            res.headers.set("location", url);
            res.send();
        };

        res.cookie = (name, value, options = {}) => {
            let object;
            if (typeof name == "string") {
                object = { name, value, ...options };
            } else {
                object = { ...name, ...options };
            }
            // remove
            object.value = object.value || "";
            if (!object.value) {
                object.expires = new Date(0);
                object.maxAge = 0;
            }
            const array = [];
            if (object.expires !== undefined) array.push(`Expires=${object.expires.toUTCString()}`);
            if (object.maxAge !== undefined) array.push(`Max-Age=${object.maxAge}`);
            if (object.domain !== undefined) array.push(`Domain=${object.domain}`);
            if (object.path !== undefined) array.push(`Path=${object.path}`);
            if (object.secure !== undefined) array.push(`Secure`);
            if (object.httpOnly !== undefined) array.push(`HttpOnly`);
            if (object.sameSite !== undefined) array.push(`SameSite=${object.sameSite}`);
            res.headers.set("set-cookie", array.join("; "));
        };
    }

    defaultHandler(req, res) {
        res.status = 404;
        throw { message: http.STATUS_CODES[res.status] };
    }

    errorHandler(err, req, res) {
        res.status = res.status == 200 ? 500 : res.status;
        res.json(err);
    }

    async handleRequest(req, res) {
        try {
            await this.beforeRequest(req, res);
            this.beforeResponse(req, res);

            await this.forEachRoute(req, res);

            this.defaultHandler(req, res);
        } catch (err) {
            if (typeof err == "object") {
                const replacer = Object.getOwnPropertyNames(err);
                err = JSON.stringify(err, replacer);
                err = JSON.parse(err);
            }
            try {
                const { callback: [callback] = [] } = this.routes[this.routes.length - 1];
                callback(err, req, res, (next) => {});
            } catch (error) {
                this.errorHandler(err, req, res);
            }
        }
    }

    async forEachRoute(req, res) {
        for (let i = 0; i < this.routes.length; i++) {
            const route = this.routes[i];

            const passed = (route.method == ".*" || route.method == req.method) && route.regexp.test(req.path);

            if (!passed) {
                continue;
            }
            // params
            req.params = {
                ...req.path.match(route.regexp)?.groups,
            };

            await this.forEachCallback(route, req, res);
        }
    }

    async forEachCallback(route, req, res) {
        for (let j = 0; j < route.callback.length; j++) {
            const callback = route.callback[j];

            if (callback.length > 3) {
                continue;
            }
            await this.handleCallback(callback, req, res);
        }
    }

    async handleCallback(callback, req, res) {
        await new Promise((resolve, reject) => {
            callback(req, res, (err) => {
                if (err !== undefined) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    listen(port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = undefined;
        }
        hostname = hostname || "0.0.0.0";
        return http.createServer(this.handleRequest).listen(port, hostname, backlog);
    }
}

function App() {
    const router = new Router();
    const app = (...args) => router.handleRequest(...args);
    app.routes = router.routes;
    for (const name of ["post", "get", "patch", "put", "delete", "use", "listen"]) {
        app[name] = (...args) => router[name](...args);
    }
    return app;
}

App.Router = Router;

module.exports = App;
