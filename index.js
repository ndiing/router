const http = require("http");
const zlib = require("zlib");
const { Readable } = require("stream");
const { URL2, Headers } = require("@ndiing/fetch");

/**
 * ### Install
 * ```
 * npm install @ndiing/router
 * ```
 * @module router
 */

/**
 *
 */
class Router {
    routes = [];

    constructor(routes = []) {
        this.requestListener = this.requestListener.bind(this);

        for (let i = 0; i < http.METHODS.length; i++) {
            const method = http.METHODS[i];

            this[method.toLowerCase()] = (...args) => {
                this.add(method, ...args);
            };
        }

        for (let j = 0; j < routes.length; j++) {
            const { method = ".*", path = ".*", callback } = routes[j];
            this.add({ method, path, callback });
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

        let [{ routes }] = callback;

        if (routes) {
            callback = [];
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                route.path = path + route.path;
                this.add(route);
            }
        } else {
            let regexp = path;
            regexp = "^" + regexp.replace(/\:(\w+)/g, "(?<$1>[^/]+)").replace(/\/?$/, "/?$");
            regexp = new RegExp(regexp, "i");
            this.routes.push({ method, path, callback, regexp });
        }
    }

    /**
     *
     * @param  {String/Function} path
     * @param  {Function} callback
     * @method post
     */

    /**
     *
     * @param  {String/Function} path
     * @param  {Function} callback
     * @method get
     */

    /**
     *
     * @param  {String/Function} path
     * @param  {Function} callback
     * @method patch
     */

    /**
     *
     * @param  {String/Function} path
     * @param  {Function} callback
     * @method put
     */

    /**
     *
     * @param  {String/Function} path
     * @param  {Function} callback
     * @method delete
     */

    /**
     *
     * @param  {String/Function} path
     * @param  {Function} callback
     */
    use(...args) {
        this.add(".*", ...args);
    }

    /**
     *
     * @param {Stream} req
     * @property {Object} req.url2
     * @property {String} req.path
     * @property {Object} req.params
     * @property {Object} req.query
     * @property {Object} req.headers
     * @property {Object} req.cookies
     * @property {String} req.contentType
     * @property {Any} req.body
     * @returns {Stream}
     */
    async request(req) {
        req.url2 = new URL2(req.url);

        req.path = req.url2.pathname;

        req.params = {};

        req.query = req.url2.searchParams;
        req.headers = new Headers(req.headers);

        req.cookies = {};

        // cookie
        if (req.headers.has("cookie")) {
            const cookies = req.headers.get("cookie").matchAll(/([^\=;]+?)\=([^\=;]+?)?(; |$)/g);
            for (const [, name, value] of cookies) {
                req.cookies[name] = value;
            }
        }

        // body
        if (!/(GET|HEAD|DELETE)/.test(req.method)) {
            req.contentType = req.headers.get("content-type");

            req.body = [];

            for await (const chunk of req) {
                req.body.push(chunk);
            }

            req.body = Buffer.concat(req.body);
            if (/json/.test(req.contentType)) {
                req.body = JSON.parse(req.body);
            } else if (/text/.test(req.contentType)) {
                req.body = "" + req.body;
            }
        }

        return req;
    }

    /**
     *
     * @param {Stream} res
     * @property {Number} res.status
     * @property {Object} res.headers
     * @property {Function} res.send
     * @property {Function} res.json
     * @property {Function} res.redirect
     * @property {Function} res.cookie
     * @returns {Stream}
     */
    response(res) {
        /**
         *
         */
        res.status = res.statusCode;

        /**
         *
         */
        res.headers = new Headers({
            "Access-Control-Allow-Origin": "*",
            "X-XSS-Protection": "1; mode=block",
            "Content-Security-Policy": "default-src 'self'",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "X-Download-Options": "noopen",
            "Referrer-Policy": "no-referrer",
            "Cache-Control": "no-store",
            "X-DNS-Prefetch-Control": "on",
            "X-Powered-By": "Ndiing",
            ...res.headers,
        });

        /**
         *
         * @param {String} body
         */
        res.send = (body = "") => {
            res.contentType = res.headers.get("content-type");
            if (/json/.test(res.contentType)) {
                body = JSON.stringify(body);
            }

            let readable = body;
            let acceptEncoding = res.req.headers.get("accept-encoding");
            if (!(body instanceof Readable)) {
                readable = new Readable();
                readable.push(body);
                readable.push(null);

                body = readable;
            }

            if (/\bgzip\b/.test(acceptEncoding)) {
                res.headers.set("content-encoding", "gzip");
                readable = body.pipe(zlib.createGzip());
            } else if (/\bdeflate\b/.test(acceptEncoding)) {
                res.headers.set("content-encoding", "deflate");
                readable = body.pipe(zlib.createDeflate());
            } else if (/\bbr\b/.test(acceptEncoding)) {
                res.headers.set("content-encoding", "br");
                readable = body.pipe(zlib.createBrotliCompress());
            }

            body = readable;

            res.writeHead(res.status, res.headers.entries());
            body.pipe(res);
        };

        /**
         *
         * @param {Object} body
         */
        res.json = (body) => {
            res.headers.set("content-type", "application/json");
            res.send(body);
        };

        /**
         *
         * @param {String} url
         * @param {Number} status
         */
        res.redirect = (url, status = 302) => {
            res.status = status;
            res.headers.set("location", url);
            res.send();
        };

        /**
         *
         * @param {String/Object} name
         * @param {String} value
         * @param {Object} options
         */
        res.cookie = (name, value, options = {}) => {
            let object = name;
            if (typeof name == "string") {
                object = {
                    name,
                    value,
                    ...options,
                };
            }
            object.value = object.value || "";

            if (!object.value) {
                object.expires = new Date(0);
                object.maxAge = 0;
            }

            const array = [object.name + "=" + object.value];
            if (object.expires !== undefined) array.push("Expires=" + object.expires.toUTCString());
            if (object.maxAge !== undefined) array.push("Max-Age=" + object.maxAge);
            if (object.domain !== undefined) array.push("Domain=" + object.domain);
            if (object.path !== undefined) array.push("Path=" + object.path);
            if (object.secure !== undefined) array.push("Secure");
            if (object.httpOnly !== undefined) array.push("HttpOnly");
            if (object.sameSite !== undefined) array.push("SameSite=" + object.sameSite);
            res.headers.append("set-cookie", array.join("; "));
        };

        return res;
    }

    async requestListener(req, res) {
        try {
            req = await this.request(req);
            res = this.response(res);

            for (let i = 0; i < this.routes.length; i++) {
                const route = this.routes[i];
                const passed = (route.method == ".*" || route.method == req.method) && route.regexp.test(req.path);

                if (!passed) {
                    continue;
                }

                req.params = { ...req.path.match(route.regexp)?.groups };

                for (let j = 0; j < route.callback.length; j++) {
                    const callback = route.callback[j];

                    try {
                        await new Promise((resolve, reject) => {
                            callback(req, res, (next) => {
                                if (next == undefined) {
                                    resolve();
                                } else {
                                    reject(next);
                                }
                            });
                        });
                    } catch (error) {
                        if (!(error instanceof TypeError)) {
                            throw error;
                        }
                    }
                }
            }

            res.status = 404;
            throw { message: http.STATUS_CODES[res.status] };
        } catch (err) {
            if (typeof err == "object") {
                let replacer = Object.getOwnPropertyNames(err);
                err = JSON.stringify(err, replacer);
                err = JSON.parse(err);
            }

            try {
                const { callback: [callback] = [] } = this.routes[this.routes.length - 1];
                callback(err, req, res, (next) => {
                    throw next;
                });
            } catch (error) {
                if (res.status == 200) {
                    res.status = 500;
                }

                res.json(err);
            }
        }
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
            hostname = "0.0.0.0";
        }

        return http.createServer(this.requestListener).listen(port, hostname, backlog);
    }
}

function Layer() {
    const router = new Router();
    const app = (req, res) => router.requestListener(req, res);
    app.routes = router.routes;
    const methods = ["add", "use", "listen"].concat(http.METHODS);
    for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        app[method.toLowerCase()] = (...args) => {
            router[method.toLowerCase()](...args);
        };
    }
    return app;
}

Layer.Router = Router;
module.exports = Layer;
