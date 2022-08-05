const http = require("http");
const url = require("url");

/**
 * Nodejs router module
 *
 * ### Install
 * ```
 * npm install @ndiing/router
 * ```
 * @module router
 */

function Router() {
    function parseQuery(searchParams) {
        const query = {};

        for (const [name, value] of searchParams) {
            if (query[name]) {
                if (Array.isArray(query[name])) query[name] = [...query[name], value];
                else query[name] = [query[name], value];
            } else query[name] = value;
        }
        return query;
    }

    function parseCookie(cookieString) {
        const cookie = {};
        if (cookieString) for (const [, name, value] of cookieString.matchAll(/([\s\S]+?)=([\s\S]+?)(; ?|$)/g)) cookie[name] = value;
        return cookie;
    }

    /**
     * 
     * @param {Object} req -
     * @param {Object} req.Url -
     * @param {Object} req.query -
     * @param {Object} req.cookie -
     * @param {Object} req.mimeType -
     * @param {Object} req.body -
     * @param {Object} res -
     * @param {Object} res.cookie - (name,value,options)
     * @param {Object} res.json - (object)
     * @memberof module:router
     */
    async function app(req, res) {
        try {
            // beforeRender

            req.Url = url.parse(req.url);
            req.query = parseQuery(new URLSearchParams(req.Url.query));
            req.cookie = parseCookie(req.headers.cookie);
            req.mimeType = req.headers?.["content-type"] ?? "";
            if (req.method !== "GET" && req.method !== "DELETE" && req.method !== "HEAD") {
                if (req.mimeType) {
                    const buffer = [];
                    for await (const chunk of req) buffer.push(chunk);
                    const body = Buffer.concat(buffer).toString();
                    if (req.mimeType.includes("json")) req.body = JSON.parse(body);
                    else if (req.mimeType.includes("urlencoded")) req.body = parseQuery(new URLSearchParams(body));
                    else req.body = body;
                }
            }

            res.cookie = function (name, value, options = {}) {
                if (!name) {
                    for (const name in req.cookie) res.cookie(name);
                    return;
                }
                const cookies = res.getHeader("Set-Cookie") || [];

                if (!value) {
                    options.expires = new Date(0);
                    options.maxAge = 0;
                }
                value = value || "";
                const cookie = [`${name}=${value}`];

                if (options.expires) {
                    if (options.maxAge) {
                        const maxAge = options.expires.getTime() - Date.now() + 1000 * options.maxAge;
                        cookie.push(`Max-Age=${maxAge}`);
                    } else cookie.push(`Expires=${options.expires.toUTCString()}`);
                } else if (options.maxAge) cookie.push(`Max-Age=${1000 * options.maxAge}`);
                if (options.domain) cookie.push(`Domain=${options.domain}`);
                if (options.path) cookie.push(`Path=${options.path}`);
                if (options.secure) cookie.push(`Secure`);
                if (options.httpOnly) cookie.push(`HttpOnly`);
                if (options.sameSite) cookie.push(`SameSite=${options.sameSite}`);
                const cookieString = cookie.join("; ");
                res.setHeader("Set-Cookie", [...cookies, cookieString]);
            };

            res.json = function (value) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(value));
            };
            // render

            for (let i = 0; i < app.routes.length; i++) {
                const { method, regexp, functions } = app.routes[i];
                const matches = (method == null || method == req.method) && regexp.test(req.Url.pathname);
                if (!matches) continue;
                // /api/google/v1/:id
                // /api/google/v1/1
                // {id:1}
                req.params = { ...req.Url.pathname.match(regexp)?.groups };

                for (let j = 0; j < functions.length; j++) {
                    const fn = functions[j];
                    try {
                        await new Promise(function (resolve, reject) {
                            fn(req, res, function (next) {
                                if (next == undefined) resolve();
                                else reject(next);
                            });
                        });
                    } catch (error) {
                        if (!(error instanceof TypeError)) throw error;
                    }
                }
            }
        } catch (err) {
            const [
                {
                    functions: [userError],
                },
                ,
                {
                    functions: [systemError],
                },
            ] = app.routes.slice(-3);
            try {
                userError(err, req, res, (next) => {});
            } catch (error) {
                systemError(err, req, res, (next) => {});
            }
        }
    }
    app.routes = [];

    app.add = function (index, method, path, ...functions) {
        if (typeof index == "object") ({ index, method, path, functions } = index);

        if (typeof path == "function") {
            functions = [path, ...functions];
            path = ".*";
        }
        let regexp = path;
        const [{ routes }] = functions;

        if (routes) {
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                route.path = path + route.path;
                app.add(route);
            }
        } else {
            regexp = new RegExp("^" + regexp.replace(/\:(\w+)/g, "(?<$1>[^/]+)").replace(/\/?$/, "/?$"));
            const route = { index, method, path, regexp, functions };
            app.routes.push(route);

            app.routes.sort(function (a, b) {
                return a.index - b.index;
            });
        }
    };

    /**
     * Add middleware
     * @param  {String} path  - 
     * @param  {Function} middleware  - 
     * @memberof module:router
     */
    app.use = function (...args) {
        app.add(1, null, ...args);
    };

    /**
     * Add middleware
     * @param  {String} path  - 
     * @param  {Function} middleware  - 
     * @method {get/post/put/patch/delete}
     * @memberof module:router
     */
    for (const method of http.METHODS) {
        app[method.toLowerCase()] = function (...args) {
            app.add(1, method, ...args);
        };
    }

    /**
     * 
     * @param {Number} port  - 
     * @param {String} hostname  - 
     * @param {Function} backlog  - 
     * @memberof module:router
     */
    app.listen = function (port, hostname, backlog) {
        const options = {
            insecureHTTPParser: true,
        };

        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = "0.0.0.0";
        }
        return http.createServer(options, app).listen(port, hostname, backlog);
    };
    app.add(2, null, (req, res, next) => {
        res.statusCode = 400;
        next({ message: http.STATUS_CODES[404] });
    });
    app.add(2, null, (err, req, res, next) => {
        err = JSON.stringify(err, Object.getOwnPropertyNames(err));
        err = JSON.parse(err);
        if (res.statusCode < 500) res.statusCode = 500;
        res.json(err);
    });
    return app;
}

module.exports = Router;
