const http = require("http");
const zlib = require("zlib");
const { Readable } = require("stream");
const { URL2, Headers } = require("@ndiinginc/fetch");
const Crypto = require("@ndiinginc/crypto");
const Database = require("@ndiinginc/database");
const { Date2 } = require("@ndiinginc/util");

/**
 * 
 */
class Router {
    routes = [];
    errors = [];

    static body() {
        return async (req, res) => {
            const buffer = [];
            for await (const chunk of req) {
                buffer.push(chunk);
            }
            const type = req.headers.get("Content-Type");
            if (/json/.test(type)) {
                req.body = JSON.parse(Buffer.concat(buffer));
            } else {
                req.body = "" + Buffer.concat(buffer);
            }
        };
    }
    
    static security() {
        return (req, res) => {
            res.headers.set("Content-Security-Policy", "default-src 'self'");
            res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            res.headers.set("X-Content-Type-Options", "nosniff");
            res.headers.set("X-Frame-Options", "DENY");
            res.headers.set("X-XSS-Protection", "1; mode=block");
            res.headers.set("Access-Control-Allow-Origin", "*");
        };
    }
    
    static compression() {
        return (req, res) => {
            const send = res.send;
            res.send = (body = "") => {
                const encoding = req.headers.get("Accept-Encoding");

                let readable = body;
                if (!(body instanceof Readable)) {
                    readable = new Readable();
                    readable.push(body);
                    readable.push(null);
                }
                if (/\bgzip\b/.test(encoding)) {
                    res.headers.set("Content-Encoding", "gzip");
                    readable = readable.pipe(zlib.createGzip());
                } else if (/\bdeflate\b/.test(encoding)) {
                    res.headers.set("Content-Encoding", "deflate");
                    readable = readable.pipe(zlib.createDeflate());
                } else if (/\bbr\b/.test(encoding)) {
                    res.headers.set("Content-Encoding", "br");
                    readable = readable.pipe(zlib.createBrotliCompress());
                }
                body = readable;

                send(body);
            };
        };
    }
    
    static cache() {
        return (req, res) => {
            const send = res.send;
            res.send = (body = "") => {
                const hash = Crypto.hash(body, { algorithm: "sha1" });
                const etag = `W/"${hash}"`;
                res.headers.set("ETag", etag);

                if (req.headers.get("If-None-Match") == etag) {
                    res.status = 304;
                    body = "";
                }

                send(body);
            };
        };
    }
    
    static cookie() {
        return (req, res) => {
            req.cookie = {};
            if (req.headers.has("Cookie")) {
                for (const [, name, value] of req.headers.get("Cookie").matchAll(/([^\=;]+?)\=([^\=;]+?)?(; |$)/g)) {
                    req.cookie[name] = value;
                }
            }

            res.cookie = (name, value, options = {}) => {
                let object = name;

                if (typeof name == "string") {
                    object = { name, value, ...options };
                }

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

                res.headers.set("Set-Cookie", array.join("; "));
            };
        };
    }
    
    static limiter(options = {}) {
        const { window, counter } = options;
        return (req, res) => {
            const pool = Database.get(req.origin);
            const key = "" + [req.ip, req.path];
            let value = pool.sessionStorage.getItem(key) || { counter };
            res.headers.set("X-RateLimit-Limit", counter);
            res.headers.set("X-RateLimit-Remaining", value.counter);
            if (Date.now() > value.time) {
                pool.sessionStorage.removeItem(key);
            }
            if (value.counter > 0) {
                --value.counter;
                pool.sessionStorage.setItem(key, value);
            } else {
                if (!value.time) {
                    const date = new Date2().add(window, "s");
                    value.time = date.valueOf();
                    value.date = date.toUTCString();
                }
                res.status = 429;
                res.headers.set("Retry-After", value.date);
                throw { message: http.STATUS_CODES[res.status] };
            }
        };
    }
    
    static defaultRoute() {
        return (req, res) => {
            res.status = 404;
            throw { message: http.STATUS_CODES[res.status] };
        };
    }
    
    static defaultError() {
        return (err,req, res) => {
            res.status = res.status == 200 ? 500 : res.status;
            res.json(err);
        };
    }

    constructor(config = {}) {
        this.config = {
            body: Router.body,
            security: Router.security,
            compression: Router.compression,
            cache: Router.cache,
            cookie: Router.cookie,
            limiter: Router.limiter,
            defaultRoute: Router.defaultRoute,
            defaultError: Router.defaultError,
            ...config,
        };
        this.handleRequest = this.handleRequest.bind(this);
    }

    add(method, path, ...listener) {
        if (typeof method == "object") {
            ({ method, path, listener } = method);
        }

        if (!Array.isArray(listener)) {
            listener = [listener];
        }

        if (typeof path == "function") {
            listener = [path, ...listener];
            path = ".*";
        }
        const [{ routes }] = listener;

        if (routes) {
            listener = [];

            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                route.path = path + route.path;
                this.add(route);
            }
        } else {
            const regexp = new RegExp("^" + (path.source || path).replace(/\:(\w+)/g, "(?<$1>[^/]+)").replace(/\/?$/, "/?$"), "i");
            const [callback] = listener;
            const stacks = callback.length > 3 ? this.errors : this.routes;
            stacks.push({ method, path, regexp, listener });
        }
        return this;
    }

    use(...args) {
        this.add(".*", ...args);
        return this;
    }

    connect(...args) {
        this.add("CONNECT", ...args);
        return this;
    }

    delete(...args) {
        this.add("DELETE", ...args);
        return this;
    }

    get(...args) {
        this.add("GET", ...args);
        return this;
    }

    head(...args) {
        this.add("HEAD", ...args);
        return this;
    }

    options(...args) {
        this.add("OPTIONS", ...args);
        return this;
    }

    patch(...args) {
        this.add("PATCH", ...args);
        return this;
    }

    post(...args) {
        this.add("POST", ...args);
        return this;
    }

    put(...args) {
        this.add("PUT", ...args);
        return this;
    }

    trace(...args) {
        this.add("TRACE", ...args);
        return this;
    }

    // headers
    // origin
    // ip
    // url2
    // path
    // query
    // params
    // cookie
    // body
    async beforeRequest(req, res) {
        req.headers = new Headers(req.headers);
        req.origin = (req.socket.encrypted ? "https:" : "http:") + "//" + req.headers.get("host");
        req.ip = req.socket.remoteAddress;
        req.url2 = new URL2(req.url, req.origin);
        req.path = req.url2.pathname;
        req.query = req.url2.searchParams;
    }

    // status
    // headers
    // send(body)
    // json(body)
    // redirect(url,status)
    // cookie(name,value,options)
    async beforeResponse(req, res) {
        res.status = res.statusCode;
        res.headers = new Headers(res.headers);

        res.send = (body = "") => {
            if (!(body instanceof Readable)) {
                let readable = new Readable();
                readable.push(body);
                readable.push(null);
                body = readable;
            }
            res.writeHead(res.status, res.headers.entries());
            body.pipe(res);
        };

        res.json = (body = {}) => {
            res.headers.set("Content-Type", "application/json");
            res.send(JSON.stringify(body));
        };

        res.redirect = (url = "", status = 302) => {
            res.status = status;
            res.headers.set("Location", url);
            res.send();
        };
    }

    async handleRequest(req, res) {
        try {
            await this.beforeRequest(req, res);
            await this.beforeResponse(req, res);

            if (this.config.body) {
                await this.config.body()(req, res);
            }

            if (this.config.security) {
                this.config.security()(req, res);
            }

            if (this.config.compression) {
                this.config.compression()(req, res);
            }

            if (this.config.cache) {
                this.config.cache()(req, res);
            }

            if (this.config.cookie) {
                this.config.cookie()(req, res);
            }

            if (this.config.limiter) {
                this.config.limiter({ window: 60 * 60, counter: 100 })(req, res);
            }

            for (let i = 0; i < this.routes.length; i++) {
                req.route = this.routes[i];
                const skip = !((req.route.method == req.method || req.route.method == ".*") && req.route.regexp.test(req.path));

                if (skip) {
                    continue;
                }

                req.params = { ...req.path.match(req.route.regexp)?.groups };

                for (let j = 0; j < req.route.listener.length; j++) {
                    const callback = req.route.listener[j];

                    await new Promise((resolve, reject) => {
                        callback(req, res, (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                }
            }

            if (this.config.defaultRoute) {
                this.config.defaultRoute()(req, res);
            }
        } catch (err) {
            if (typeof err == "object") {
                // Error parser
                err = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            }

            // User defined error handler
            for (let i = 0; i < this.errors.length; i++) {
                const { listener: [callback] = [] } = this.errors[i];

                await new Promise((resolve, reject) => {
                    callback(err, req, res, () => {
                        resolve();
                    });
                });
            }

            if (this.config.defaultError) {
                this.config.defaultError()(err,req, res);
            }
        }
    }

    listen(port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = null;
        }

        hostname = hostname || "127.0.0.1";

        const server = http.createServer().listen(port, hostname, backlog);
        server.on("request", this.handleRequest);
        return server;
    }
}

module.exports = Router;

// Create routerA
const routerA = new Router();

// Using chain method
routerA
    .use((req, res, next) => {
        next();
    })
    .get("/", (req, res, next) => {
        res.json({ message: "routerA get" });
    })
    .post("/", (req, res, next) => {
        res.json({ message: "routerA post" });
    })
    .patch("/:id", (req, res, next) => {
        res.json({
            origin: req.origin,
            ip: req.ip,
            url2: req.url2,
            path: req.path,
            query: req.query,
            params: req.params,
            cookie: req.cookie,
            body: req.body,
            status: res.status,
        });
    })
    .delete("/:id", (req, res, next) => {
        res.json({ message: "routerA delete" });
    });

// Create router1
const router1 = new Router();
router1.use((req, res, next) => {
    next();
});

// Register routerA to router1
router1.use("/routerA", routerA);
router1.get("/", (req, res, next) => {
    res.json({ message: "router1 get" });
});

// Create app
const app = new Router({
    // body
    // security
    // compression
    // cache
    // cookie
    // limiter
    // defaultRoute
    // defaultError
});
app.use((req, res, next) => {
    next();
});

// Register router1 to app
app.use("/router1", router1);
app.get("/", (req, res, next) => {
    res.json({ message: "app get" });
});

// Test error
app.get("/internal-server-error", (req, res, next) => {
    throw new Error("internal-server-error");
});

// Custom default route
app.use((req, res, next) => {
    res.status = 404;
    next({ message: "page not found" });
});

// Custom error handler
app.use((err, req, res, next) => {
    if (err && typeof err == "object") {
        err = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
    res.status = res.status == 200 ? 500 : res.status;
    res.json({ err });
});

// Start server
app.listen(3000);