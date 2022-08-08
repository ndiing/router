const http = require("http");
const url = require("url");
const zlib = require("zlib");

/**
 * Nodejs router module
 * ### Install
 * ```
 * npm install @ndiing/router
 * ```
 * @see {@link ./examples/server.js}
 * @see {@link ./examples/server-express-like-style.js}
 * @module router
 */

/**
 *
 */
class Headers {
    /**
     * Create headers
     * @param {Any} init
     */
    constructor(init = {}) {
        for (const name in init) {
            this.append(name, init[name]);
        }
    }

    /**
     * Append value by name, if exists it's create an array of values
     * @param {Any} name
     * @param {Any} value
     */
    append(name, value) {
        name = name.toLowerCase();
        if (this[name]) {
            if (Array.isArray(this[name])) {
                this[name].push(value);
            } else {
                this[name] = [this[name], value];
            }
        } else {
            this[name] = value;
        }
    }

    /**
     * Delete headers by name
     * @param {Any} name
     */
    delete(name) {
        name = name.toLowerCase();
        delete this[name];
    }

    /**
     * Get array of [name,value]
     * @returns {Array}
     */
    entries() {
        const keys = this.keys();
        const values = [];
        for (let i = 0; i < keys.length; i++) {
            const name = keys[i];
            values.push([name.replace(/(^|[^\w])(\w)/g, ($, $1, $2) => $1 + $2.toUpperCase()), this[name]]);
        }
        return values;
    }

    /**
     * Get headers by name
     * @param {Any} name
     * @returns {Any}
     */
    get(name) {
        name = name.toLowerCase();
        return this[name];
    }

    /**
     * Check headers name exists
     * @param {Any} name
     * @returns {Boolean}
     */
    has(name) {
        name = name.toLowerCase();
        return !!this[name];
    }

    /**
     * Get array of headers names
     * @returns {Array}
     */
    keys() {
        return Object.getOwnPropertyNames(this);
    }

    /**
     * Set value by name
     * @param {Any} name
     * @param {Any} value
     */
    set(name, value) {
        name = name.toLowerCase();
        this[name] = value;
    }

    /**
     * Get Array of heades value
     * @returns {Array}
     */
    values() {
        const keys = this.keys();
        const values = [];
        for (let i = 0; i < keys.length; i++) {
            const name = keys[i];
            values.push(this[name]);
        }
        return values;
    }
}

// // Usage
// var headers = new Headers()
// console.log(headers)
// var headers = new Headers({'Content-Type':'application/json'})
// headers.set('connection','keep-alive')
// headers.append('set-cookie','name1=value1')
// headers.append('set-cookie','name2=value2')
// headers.append('set-cookie','name3=value3')
// headers.delete('set-cookie')
// console.log(headers.keys())
// console.log(headers.values())
// console.log(headers.entries())
// console.log(headers)

/**
 *
 */
class Request {
    /**
     * Wrap Request from stream
     * @param {Any} input
     * @param {Any} options
     */
    constructor(input = "", options = {}) {
        /**
         * @readonly
         */
        this.body = options.body || [];

        /**
         * @readonly
         */
        this.headers = new Headers(options.headers);

        /**
         * @readonly
         */
        this.method = options.method;

        /**
         * @readonly
         */
        this.url = url.parse(input);

        /**
         * @readonly
         */
        this.url.searchParams = new url.URLSearchParams(this.url.query);

        /**
         * @readonly
         */
        this.stream = options;

        /**
         * @readonly
         */
        this.params = {};

        /**
         * @readonly
         */
        this.query = {};
        // parseQuery
        for (const [name, value] of this.url.searchParams) {
            if (this.query[name]) {
                if (Array.isArray(this.query[name])) {
                    this.query[name].push(value);
                } else {
                    this.query[name] = [this.query[name], value];
                }
            } else {
                this.query[name] = value;
            }
        }

        /**
         * @readonly
         */
        this.cookies = {};
        // parseCookies
        if (this.headers.has("cookie")) {
            for (const cookie of this.headers.get("cookie").split("; ")) {
                const [name, value] = cookie.split("=");
                this.cookies[name] = value;
            }
        }

        this.request = {};
    }
}

// // Usage
// var request=new Request('/',{})
// console.log(request)

/**
 *
 */
class Response {
    /**
     *
     * @param {Any} body
     * @param {Any} options
     */
    constructor(body = [], options = {}) {
        this.body = body;

        options.headers = {
            "Access-Control-Allow-Origin": "*",
            "Content-Security-Policy": "default-src 'self';base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-origin",
            "X-DNS-Prefetch-Control": "off",
            "Expect-CT": "max-age=0",
            "X-Frame-Options": "SAMEORIGIN",
            "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
            "X-Download-Options": "noopen",
            "X-Content-Type-Options": "nosniff",
            "Origin-Agent-Cluster": "?1",
            "X-Permitted-Cross-Domain-Policies": "none",
            "Referrer-Policy": "no-referrer",
            "X-XSS-Protection": "0",
            Connection: "close",
            "Content-Type": "text/html",
            "X-Powered-By": "Ndiing",
            ...options.headers,
        };

        /**
         * @readonly
         */
        this.headers = new Headers(options.headers);

        /**
         * @readonly
         */
        this.status = options.status || 200;

        this.stream = options;
    }

    /**
     * Send string of response
     * @param {Any} value
     */
    send(value = "") {
        let stream = this.stream;

        // set status
        this.stream.statusCode = this.status;

        // set compression
        if (/\bdeflate\b/.test(this.request.headers.get("accept-encoding"))) {
            this.headers.set("content-encoding", "deflate");
            // stream = deflate
            stream = zlib.createDeflate();
        } else if (/\bgzip\b/.test(this.request.headers.get("accept-encoding"))) {
            this.headers.set("content-encoding", "gzip");
            // stream = gzip
            stream = zlib.createGzip();
        } else if (/\bbr\b/.test(this.request.headers.get("accept-encoding"))) {
            this.headers.set("content-encoding", "br");
            // stream = br
            stream = zlib.createBrotliCompress();
        }

        // set connection = keep-alive
        if (stream !== this.stream || this.request.headers.get("connection") == "keep-alive") {
            this.headers.set("connection", "keep-alive");

            if (stream !== this.stream) {
                stream.pipe(this.stream);
            }
        }

        // set headers
        for (const [name, value] of this.headers.entries()) {
            this.stream.setHeader(name, value);
        }

        // stringify object/array
        if (/json/.test(this.headers.get("content-type")) && typeof value == "object") {
            value = JSON.stringify(value);
        }

        // buffer
        value = Buffer.from(value);

        if (this.headers.get("connection") == "keep-alive") {
            // keep-alive
            stream.write(value);
            stream.end();
        } else {
            // close
            stream.end(value);
        }
    }

    /**
     * Send object/array as json response
     * @param {Any} value
     */
    json(value = {}) {
        this.headers.set("content-type", "application/json");
        this.send(value);
    }

    /**
     * Send `set-cookie`
     * @param {Any} name 
     * @param {Any} value 
     */
    cookie(name, value) {
        let cookie = name;

        if (typeof name == "string") {
            cookie = { name, value };
        }

        cookie.value = cookie.value || "";
        let cookieArray = [`${cookie.name}=${cookie.value}`];

        if (!cookie.value) {
            cookie.expires = new Date(0);
            cookie.maxAge = 0; //0s
        }

        if (cookie.expires) cookieArray.push(`Expires=${cookie.expires.toUTCString()}`);
        if (cookie.maxAge) cookieArray.push(`Max-Age=${cookie.maxAge}`);
        if (cookie.domain) cookieArray.push(`Domain=${cookie.domain}`);
        if (cookie.path) cookieArray.push(`Path=${cookie.path}`);
        if (cookie.secure) cookieArray.push(`Secure`);
        if (cookie.httpOnly) cookieArray.push(`HttpOnly`);
        if (cookie.sameSite) cookieArray.push(`SameSite=${cookie.sameSite}`);

        let cookieString = cookieArray.join("; ");

        this.headers.append("set-cookie", cookieString);
    }
}

// // Usage
// var response = new Response([],{})
// console.log(response)

/**
 *
 */
class Router {
    /**
     * @readonly
     */
    routes = [];

    /**
     * Create router
     * @param {Any} init
     */
    constructor(init = []) {
        // data binding
        this.requestListener = this.requestListener.bind(this);

        for (let i = 0; i < init.length; i++) {
            this.add(init[i]);
        }
    }

    /**
     * Adding route
     * @param {Any} route
     * @private
     */
    add(route = {}) {
        let { method = ".*", path = ".*", callback } = route;

        if (!Array.isArray(callback)) {
            callback = [callback];
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
            const route = { method, path, callback, routes };

            // Create regexp
            route.regexp = "^" + route.path.replace(/\:(\w+)/g, "(?<$1>[^/]+)").replace(/\/?$/, "") + "/?$";
            route.regexp = new RegExp(route.regexp);

            this.routes.push(route);
        }
    }

    /**
     * `http.requestListener`
     * @param {Any} req
     * @param {Any} res
     */
    async requestListener(req, res) {
        try {
            req = new Request(req.url, req);
            res = new Response([], res);
            res.request = req;

            // parseBody
            // beside head and get
            if (!/(GET|HEAD)/.test(req.method)) {
                for await (const chunk of req.stream) {
                    req.body.push(chunk);
                }
                req.body = Buffer.concat(req.body);
                if (/json/.test(req.headers.get("content-type"))) {
                    req.body = JSON.parse(req.body);
                } else {
                    req.body = req.body.toString();
                }
            }

            for (let i = 0; i < this.routes.length; i++) {
                const route = this.routes[i];
                const passed = (route.method == ".*" || route.method == req.method) && route.regexp.test(req.url.pathname);

                if (!passed) {
                    continue;
                }

                // parseParams
                req.params = { ...req.url.pathname.match(route.regexp)?.groups };

                // handleCallback
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

            // Handle default route
            res.status = 404;
            throw { message: http.STATUS_CODES[res.status] };
        } catch (err) {
            if (typeof err == "object") {
                err = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            }

            try {
                const [{ callback: [callback] = [] }] = this.routes.slice(-1);
                callback(err, req, res, (next) => {});
            } catch (error) {
                // Handle default error
                res.status = res.status == 200 ? 500 : res.status;
                res.json(err);
            }
        }
    }
}

/**
 *
 */
function Layer() {
    const router = new Router();
    const app = (req, res) => router.requestListener(req, res);
    app.routes = router.routes;

    app.add = function (method, path, ...callback) {
        if (typeof path == "function") {
            callback = [path, ...callback];
            path = ".*";
        }
        router.add({ method, path, callback });
    };

    /**
     *
     * @param  {String} path -
     * @param  {Array/Function} callback -
     * @method use
     */
    app.use = function (...args) {
        app.add(".*", ...args);
    };

    /**
     *
     * @param  {String} path -
     * @param  {Array/Function} callback -
     * @method post/get/patch/put/delete
     */
    for (let i = 0; i < http.METHODS.length; i++) {
        const method = http.METHODS[i];

        app[method.toLowerCase()] = function (...args) {
            app.add(method, ...args);
        };
    }

    /**
     *
     * @param {Number} port -
     * @param {String} hostname -
     * @param {Function} backlog -
     * @returns {Object}
     * @method listen
     */
    app.listen = function (port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = "0.0.0.0";
        }

        return http.createServer(app).listen(port, hostname, backlog);
    };

    return app;
}

Layer.Headers = Headers;
Layer.Request = Request;
Layer.Response = Response;
Layer.Router = Router;

module.exports = Layer;
