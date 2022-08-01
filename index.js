const http = require("http");
const url = require("url");
/**
 * Create Router/App
 * @returns {Function/Object}
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

    async function app(req, res) {
        try {
            // beforeRender
            /**
             * URL Object
             */
            req.Url = url.parse(req.url);
            /**
             * Query Object
             */
            req.query = parseQuery(new URLSearchParams(req.Url.query));
            /**
             * Cookie Object
             */
            req.cookie = parseCookie(req.headers.cookie);
            /**
             * Mime Type
             */
            req.mimeType = req.headers?.["content-type"] ?? "";
            /**
             * Body Object
             */

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
            /**
             * Send Cookie
             */

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

            /**
             * Send JSON message
             * @param {Object} value -
             */

            res.json = function (value) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(value));
            };
            // render

            for (let i = 0; i < app.routes.length; i++) {
                const { method, regexp, functions } = app.routes[i];
                const matches = (method == null || method == req.method) && regexp.test(req.Url.pathname);
                if (!matches) continue;
                /**
                 * Params Object
                 */
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
     * @param  {String} path - Optinal
     * @param  {Function} middleware -
     */

    app.use = function (...args) {
        app.add(1, null, ...args);
    };

    for (const method of http.METHODS) {
        app[method.toLowerCase()] = function (...args) {
            app.add(1, method, ...args);
        };
    }
    /**
     * Create HTTP server
     * @param {Number} port -
     * @param {String} hostname - Optinal
     * @param {Function} backlog -
     * @returns
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

// // Usage

// const routerA = Router();
// routerA.use((req, res, next) => {
//     next();
// });
// routerA.get("/", (req, res, next) => {
//     res.json({ message: "routerA > get > OK" });
// });
// // routerA(req, res);
// const routerB = Router();
// routerB.use((req, res, next) => {
//     next();
// });
// routerB.post("/", (req, res, next) => {
//     res.json({ message: "routerB > post > OK" });
// });
// routerB.get("/", (req, res, next) => {
//     res.json({ message: "routerB > get > OK" });
// });
// routerB.patch("/:id", (req, res, next) => {
//     const data = {
//         params: req.params,
//         query: req.query,
//         cookie: req.cookie,
//         body: req.body,
//     };
//     res.cookie("name1", "value1");
//     res.cookie("name2", "value2");
//     res.cookie("name3", "value3");
//     res.cookie("name4", "value4");
//     res.json(data);
// });
// routerB.delete("/", (req, res, next) => {
//     res.json({ message: "routerB > delete > OK" });
// });
// // routerB(req, res);
// const router1 = Router();
// router1.use((req, res, next) => {
//     next();
// });
// router1.use("/routerA", routerA);
// router1.use("/routerB", routerB);
// router1.get("/", (req, res, next) => {
//     res.json({ message: "router1 > get > OK" });
// });
// // router1(req, res);
// const router2 = Router();
// router2.use((req, res, next) => {
//     next();
// });
// router2.post("/", (req, res, next) => {
//     res.json({ message: "router2 > post > OK" });
// });
// router2.get("/", (req, res, next) => {
//     res.json({ message: "router2 > get > OK" });
// });
// router2.patch("/", (req, res, next) => {
//     res.json({ message: "router2 > patch > OK" });
// });
// router2.delete("/", (req, res, next) => {
//     res.json({ message: "router2 > delete > OK" });
// });
// // router2(req, res);
// const app = Router();
// app.use((req, res, next) => {
//     next();
// });
// app.get("/router1", router1);
// app.get("/router2", router2);
// app.get("/", (req, res, next) => {
//     res.json({ message: "app > get > OK" });
// });
// // app(req, res);
// app.listen(5555, () => {
//     console.log("app listen 5555");
// });
