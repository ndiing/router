const http = require("http");
const zlib = require("zlib");
const { URL2, Headers } = require("@ndiing/fetch");

/**
 * ### Install
 * ```
 * npm install @ndiing/router
 * ```
 * @see {@link ./test.js}
 * @module router
 */

/**
 *
 */
class Request {
    /**
     *
     * @param {String} input
     * @param {Object} options
     * @param {Stream} options.body
     * @param {Object} options.headers
     * @param {String} options.method
     * @param {Object} options.url
     * @param {Object} options.params
     * @param {Object} options.cookies
     */
    constructor(input, options = {}) {
        this.body = options;
        this.headers = new Headers(options.headers);
        this.method = options.method;
        this.url = new URL2(input);

        // params

        // headers>cookie
        this.cookies = {};

        if (this.headers.has("cookie")) {
            for (const [, name, value] of this.headers.get("cookie").matchAll(/([^\=;]+?)\=([^\=;]+?)?(; |$)/g)) {
                this.cookies[name] = value;
            }
        }
    }

    buffer() {
        return new Promise((resolve) => {
            const buffer = [];
            this.body.on("data", (chunk) => {
                buffer.push(chunk);
            });
            this.body.on("end", () => {
                resolve(Buffer.concat(buffer));
            });
        });
    }

    /**
     *
     * @returns {Object}
     */
    json() {
        return this.buffer().then((buffer) => JSON.parse(buffer));
    }

    /**
     *
     * @returns {String}
     */
    text() {
        return this.buffer().then((buffer) => buffer.toString());
    }
}

/**
 *
 */
class Response {
    /**
     *
     * @param {Stream} body
     * @param {Object} options
     * @param {Object} options.headers
     * @param {Number} options.status
     */
    constructor(body, options = {}) {
        this.body = body;
        this._body = body;

        options.headers = {
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
            ...options.headers,
        };

        this.headers = new Headers(options.headers);

        this.status = options.status || options.statusCode;

        // accept-encoding
        const acceptEncoding = this.body.req.headers["accept-encoding"];

        if (/\bgzip\b/.test(acceptEncoding)) {
            this.headers.set("content-encoding", "gzip");
            this.body = zlib.createGzip();
        } else if (/\bdeflate\b/.test(acceptEncoding)) {
            this.headers.set("content-encoding", "deflate");
            this.body = zlib.createDeflate();
        } else if (/\bbr\b/.test(acceptEncoding)) {
            this.headers.set("content-encoding", "br");
            this.body = zlib.createBrotliCompress();
        }

        if (this.body !== body) {
            this.body.pipe(body);
        }
    }

    /**
     *
     * @param {String/Object} name
     * @param {String} value
     */
    cookie(name, value) {
        let object = name;

        if (!name.name) {
            object = { name, value };
        }

        object.value = object.value || "";
        const array = [object.name + "=" + object.value];
        if (!object.value) {
            object.expires = new Date(0);
            object.maxAge = 0;
        }
        if (object.expires !== undefined) array.push("Expires=" + object.expires.toUTCString());
        if (object.maxAge !== undefined) array.push("Max-Age=" + object.maxAge);
        if (object.domain !== undefined) array.push("Domain=" + object.domain);
        if (object.path !== undefined) array.push("Path=" + object.path);
        if (object.secure !== undefined) array.push("Secure");
        if (object.httpOnly !== undefined) array.push("HttpOnly");
        if (object.sameSite !== undefined) array.push("SameSite=" + object.sameSite);

        this.headers.append("set-cookie", array.join("; "));
    }

    /**
     *
     * @param {Any} data
     */
    buffer(data = "") {
        if (/json/.test(this.headers.get("content-type"))) {
            data = JSON.stringify(data);
        }
        data = Buffer.from(data);

        this._body.writeHead(this.status, this.headers.entries());
        this.body.write(data);
        this.body.end();
    }

    /**
     *
     * @param {Object} value
     */
    json(value) {
        this.headers.set("content-type", "application/json");
        this.buffer(value);
    }

    /**
     *
     * @param {String} value
     */
    text(value) {
        this.headers.set("content-type", "text/html");
        this.buffer(value);
    }

    /**
     *
     * @param {String} url
     * @param {Number} status
     */
    redirect(url, status = 302) {
        this.status = status;
        this.headers.set("location", url);
        this.buffer();
    }
}

/**
 *
 */
class Router {
    routes = [];

    /**
     *
     * @param {Array} routes
     */
    constructor(routes = []) {
        this.requestListener = this.requestListener.bind(this);

        for (let i = 0; i < routes.length; i++) {
            const { method = ".*", path = ".*", callback } = routes[i];
            this.add({ method, path, callback });
        }
    }

    /**
     *
     * @param {String} method
     * @param {String} path
     * @param  {...any} callback
     */
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
            regexp = regexp.replace(/\:(\w+)/g, "(?<$1>[^/]+)").replace(/\/?$/, "/?$");
            regexp = new RegExp("^" + regexp, "i");
            this.routes.push({ method, path, callback, regexp });
        }
    }

    /**
     *
     * @param {Stream} req
     * @param {Stream} res
     */
    async requestListener(req, res) {
        try {
            const input = (req.socket.encrypted ? "https:" : "http:") + "//" + req.headers.host + req.url;
            req = new Request(input, req);
            res = new Response(res, res);

            for (let i = 0; i < this.routes.length; i++) {
                const route = this.routes[i];
                const passed = (route.method == ".*" || route.method == req.method) && route.regexp.test(req.url.pathname);

                if (!passed) {
                    continue;
                }

                // params
                req.params = {
                    ...req.url.pathname.match(route.regexp)?.groups,
                };

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
                const replacer = Object.getOwnPropertyNames(err);
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
        const options = {};
        const server = http.createServer(options).listen(port, hostname, backlog);
        server.on("request", this.requestListener);
        return server;
    }
}

/**
 *
 * @returns {Object/Function}
 */
function router() {
    const router = new Router();
    const app = (req, res) => router.requestListener(req, res);
    app.routes = router.routes;

    /**
     *
     * @param  {...any} args
     * @method use
     */
    app.use = (...args) => {
        router.add(".*", ...args);
    };

    for (let i = 0; i < http.METHODS.length; i++) {
        const method = http.METHODS[i];

        /**
         *
         * @param  {...any} args
         * @method post
         */
        /**
         *
         * @param  {...any} args
         * @method get
         */
        /**
         *
         * @param  {...any} args
         * @method patch
         */
        /**
         *
         * @param  {...any} args
         * @method put
         */
        /**
         *
         * @param  {...any} args
         * @method delete
         */
        app[method.toLowerCase()] = (...args) => {
            router.add(method, ...args);
        };
    }

    /**
     *
     * @param  {...any} args
     * @returns {Object}
     * @method listen
     */
    app.listen = (...args) => {
        return router.listen(...args);
    };

    return app;
}

router.URL2 = URL2;
router.Headers = Headers;
router.Request = Request;
router.Response = Response;
router.Router = Router;
module.exports = router;

// jsdoc2md router/index.js > router/README.md
