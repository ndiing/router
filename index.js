const http = require("http");
const zlib = require("zlib");
const { Readable } = require("stream");
const { URL2, Headers } = require("@ndiinginc/fetch");
const Crypto = require("@ndiinginc/crypto");

/**
 * 
 * @returns {Function}
 */
function paramParser() {
    return async function (req, res, next) {
        req.params = {
            ...req.path.match(req.route.regexp)?.groups,
        };
        next();
    };
}

/**
 * 
 * @returns {Function}
 */
function cookieParser() {
    return function (req, res, next) {
        req.cookies = {};

        if (req.headers.has("cookie")) {
            for (const [, name, value] of req.headers.get("cookie").matchAll(/([^\=;]+)\=([^\=;]+)?(; |$)/g)) {
                req.cookies[name] = value;
            }
        }

        res.cookie = (name, value, options = {}) => {
            let object;

            if (typeof name == "string") {
                object = { name, value, ...options };
            } else {
                object = { ...name, ...options };
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
            res.headers.set("set-cookie", array.join("; "));
        };
        next();
    };
}

/**
 * 
 * @returns {Function}
 */
function bodyParser() {
    return async function (req, res, next) {
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
        next();
    };
}

/**
 * 
 * @returns {Function}
 */
function securityHandler() {
    return function (req, res, next) {
        req.headers.set("Content-Security-Policy", "default-src 'self'");
        req.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
        req.headers.set("X-Content-Type-Options", "nosniff");
        req.headers.set("X-Frame-Options", "DENY");
        req.headers.set("X-XSS-Protection", "1; mode=block");
        req.headers.set("Access-Control-Allow-Origin", "*");
        req.headers.set("Content-Language", "en-US");
        next();
    };
}

/**
 * 
 * @returns {Function}
 */
function compressionHandler() {
    return function (req, res, next) {
        const send = res.send;
        res.send = function (body) {
            const encoding = req.headers.get("accept-encoding");
            let readable = body;
            if (!(body instanceof Readable)) {
                readable = new Readable();
                readable.push(body);
                readable.push(null);
            }
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
            body = readable;
            send(body);
        };
        next();
    };
}

/**
 * 
 * @returns {Function}
 */
function cacheHandler() {
    return function (req, res, next) {
        const send = res.send;
        res.send = function (body) {
            const hash = Crypto.hash(body, { algorithm: "sha1" });
            const etag = `W/"${hash}"`;
            res.headers.set("etag", etag);

            if (req.headers.get("if-none-match") == etag) {
                res.status = 304;
                body = "";
            }
            send(body);
        };
        next();
    };
}

/**
 * 
 * @returns {Function}
 */
function defaultHandler() {
    return function (req, res, next) {
        res.status = 404;
        next({ message: http.STATUS_CODES[res.status] });
    };
}

/**
 * 
 * @returns {Function}
 */
function errorHandler() {
    return function (err, req, res, next) {
        res.status = res.status == 200 ? 500 : res.status;
        res.json(err);
    };
}

/**
 * 
 */
class Router {
    /**
    * @private
    */
    routes = [];

    /**
     * 
     * @param {Object} routes 
     */
    constructor(routes = []) {
        this.handleRequest = this.handleRequest.bind(this);

        for (let i = 0; i < routes.length; i++) {
            const { method = ".*", path = ".*", callback = [] } = routes[i];
            this.add({ method, path, callback });
        }
        this.add(0, ".*", paramParser());
        this.add(0, ".*", cookieParser());
        this.add(0, ".*", bodyParser());
        this.add(0, ".*", securityHandler());
        this.add(0, ".*", compressionHandler());
        this.add(0, ".*", cacheHandler());
        this.add(2, ".*", defaultHandler());
        this.add(2, ".*", errorHandler());
    }

    /**
     * @private
     * @param {Number} index 
     * @param {String} method 
     * @param {String} path 
     * @param  {Function} callback 
     */
    add(index, method, path, ...callback) {
        if (typeof index == "object") {
            ({ index, method, path, callback } = index);
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
            if ((index == 0 || index == 2) && path !== ".*") {
                return;
            }
            let regexp = path.source || path;
            regexp = regexp.replace(/\:(\w+)/g, "(?<$1>[^/]+)").replace(/\/?$/, "/?$");
            regexp = new RegExp("^" + regexp, "i");
            this.routes.push({ index, method, path, callback, regexp });
            this.routes.sort(function (a, b) {
                return a.index - b.index;
            });
        }
    }

    /**
     * 
     * @param  {String/Function} path 
     * @param  {Function} callback 
     */
    use(...args) {
        this.add(1, ".*", ...args);
    }

    /**
     * 
     * @param  {String/Function} path 
     * @param  {Function} callback 
     */
    post(...args){
        this.add(1,'POST',...args)
    }
    /**
     * 
     * @param  {String/Function} path 
     * @param  {Function} callback 
     */
    get(...args){
        this.add(1,'GET',...args)
    }
    /**
     * 
     * @param  {String/Function} path 
     * @param  {Function} callback 
     */
    patch(...args){
        this.add(1,'PATCH',...args)
    }
    /**
     * 
     * @param  {String/Function} path 
     * @param  {Function} callback 
     */
    put(...args){
        this.add(1,'PUT',...args)
    }
    /**
     * 
     * @param  {String/Function} path 
     * @param  {Function} callback 
     */
    delete(...args){
        this.add(1,'DELETE',...args)
    }

    /**
     * @private
     * @param {Stream} req 
     * @param {Stream} res 
     */
    async beforeRequest(req, res) {
        req.url2 = new URL2(req.url);
        req.path = req.url2.pathname;
        req.query = req.url2.searchParams;
        req.headers = new Headers(req.headers);
    }

    /**
     * @private
     * @param {Stream} req 
     * @param {Stream} res 
     */
    beforeResponse(req, res) {
        res.status = res.statusCode;
        res.headers = new Headers(res.headers);
        res.headers.set("content-type", "text/html");

        res.send = function (body = "") {
            let readable = body;
            if (!(body instanceof Readable)) {
                readable = new Readable();
                readable.push(body);
                readable.push(null);
            }
            body = readable;
            res.writeHead(res.status, res.headers.entries());
            body.pipe(res);
        };

        res.json = function (value = {}) {
            res.headers.set("content-type", "application/json");
            res.send(JSON.stringify(value));
        };

        res.redirect = function (url, status = 301) {
            res.status = status;
            res.headers.set("location", url);
            res.send();
        };
    }

    /**
     * 
     * @param {Stream} req 
     * @param {Stream} res 
     */
    async handleRequest(req, res) {
        try {
            await this.beforeRequest(req, res);
            await this.beforeResponse(req, res);
            await this.forRoute(req, res);
        } catch (err) {
            err = this.errorParser(err);
            const [{ callback: [errorHandler] = [] } = {}, , { callback: [defaultErrorHandler] = [] } = {}] = this.routes.slice(-3);
            try {
                errorHandler(err, req, res, function (next) {});
            } catch (error) {
                defaultErrorHandler(err, req, res, function (next) {});
            }
        }
    }

    /**
     * @private
     * @param {Object/Error} err 
     * @returns {Object}
     */
    errorParser(err) {
        if (typeof err == "object") {
            const replacer = Object.getOwnPropertyNames(err);
            err = JSON.stringify(err, replacer);
            err = JSON.parse(err);
        }
        return err;
    }

    /**
     * @private
     * @param {Stream} req 
     * @param {Stream} res 
     */
    async forRoute(req, res) {
        for (let i = 0; i < this.routes.length; i++) {
            req.route = this.routes[i];
            const passed =
                (req.route.method == ".*" || req.route.method == req.method) && //
                req.route.regexp.test(req.path);

            if (!passed) {
                continue;
            }
            await this.forCallback(req, res);
        }
    }

    /**
     * @private
     * @param {Stream} req 
     * @param {Stream} res 
     */
    async forCallback(req, res) {
        for (let j = 0; j < req.route.callback.length; j++) {
            const callback = req.route.callback[j];

            if (callback.length > 3) {
                continue;
            }
            await this.handleCallback(callback, req, res);
        }
    }

    /**
     * @private
     * @param {Function} callback 
     * @param {Stream} req 
     * @param {Stream} res 
     */
    handleCallback(callback, req, res) {
        return new Promise(function (resolve, reject) {
            callback(req, res, function (err) {
                if (err !== undefined) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * 
     * @param {Number} port 
     * @param {String/Function} hostname 
     * @param {Function} backlog 
     * @returns {Object}
     */
    listen(port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = undefined;
        }
        hostname = hostname || "0.0.0.0";
        return http.createServer(this.handleRequest).listen(port, hostname, backlog);
    }
}

/**
 * 
 * @returns {Object/Function}
 */
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
