const http = require("http");
const url = require("url");

/**
 * Nodejs router
 * ### Install
 * ```
 * npm install @ndiing/router
 * ```
 * ### Usage
 * ```js
 * const Router = require('../index.js')
 *
 * // Create router 1
 * var router1 = Router();
 * router1.use((req, res, next) => {
 *     next();
 * });
 * // Using HTTP method POST
 * router1.post("/", (req, res, next) => {
 *     res.json({ message: "from router1 post" });
 * });
 * // Using HTTP method GET
 * router1.get("/", (req, res, next) => {
 *     res.json({ message: "from router1 get" });
 * });
 * // Using HTTP method PATCH
 * router1.patch("/:id", (req, res, next) => {
 *
 *     console.log(req.Url)// Get URL info
 *     console.log(req.params)// Get parameters from path
 *     console.log(req.query)// Get query object
 *     console.log(req.mimeType)// Get content-type
 *     console.log(req.cookie)// Get cookie object
 *     console.log(req.body)// Get request message/data
 *
 *     // Send cookie
 *     res.cookie('name1','value1')
 *     // another
 *     res.cookie('name2','value2')
 *     // another
 *     res.cookie('name3','value3')
 *     // and remove one
 *     // from previous cookie
 *     res.cookie('name')
 *
 *     // Send json output
 *     res.json({ message: "from router1 patch" });
 * });
 * // Using HTTP method DELETE
 * router1.delete("/:id", (req, res, next) => {
 *     res.json({ message: "from router1 delete" });
 * });
 * // console.log(router1.routes);
 *
 * // Create another example router A
 * const routerA = Router();
 * routerA.use((req, res, next) => {
 *     next();
 * });
 * routerA.get("/", (req, res, next) => {
 *     res.json({ message: "from routerA get" });
 * });
 *
 * // Create another example router B
 * const routerB = Router();
 * routerB.use((req, res, next) => {
 *     next();
 * });
 * routerB.get("/", (req, res, next) => {
 *     res.json({ message: "from routerB get" });
 * });
 *
 * const router2 = Router();
 * router2.use((req, res, next) => {
 *     next();
 * });
 * // Register router A
 * // Register router B
 * router2.get("/routerA", routerA);
 * router2.get("/routerB", routerB);
 * router2.get("/", (req, res, next) => {
 *     res.json({ message: "from router2 get" });
 * });
 *
 * // Create app
 * const app = Router();
 * app.use((req, res, next) => {
 *     next();
 * });
 * // Register router 1
 * // Register router 2
 * app.get("/router1", router1);
 * app.get("/router2", router2);
 * app.get("/", (req, res, next) => {
 *     res.json({ message: "from app get" });
 * });
 *
 * // Custom not found handler
 * app.use((req, res, next) => {
 *     next({message:'page not found'});
 * });
 *
 * // Custom global error handler
 * app.use((err, req, res, next) => {
 *     res.json({ err });
 * });
 *
 * // Create server and listen on port 80
 * app.listen(80);
 *
 * ```
 * @returns {Object}
 * @module Router
 */
function Router() {
    /**
     * requestListener
     * @param {Object} req - IncomingMessage
     * @param {Object} req.Url -
     * @param {Object} req.query -
     * @param {String} req.mimeType -
     * @param {Object} req.cookie -
     * @param {Object/String} req.body -
     * @param {Object} res - ServerResponse
     * @param {Function} res.cookie - (name,value,options={})
     * @param {Function} res.json - (value)
     * @memberof module:Router
     */
    async function app(req, res) {
        try {
            req.Url = url.parse(req.url);
            // console.log(req.Url)

            const query = {};
            for (const [name, value] of new URLSearchParams(req.Url.query)) {
                if (query[name]) {
                    if (Array.isArray(query[name])) query[name].push(value);
                    else query[name] = [query[name], value];
                } else query[name] = value;
            }
            req.query = query;
            // console.log(req.query);

            req.mimeType = req.headers["content-type"];
            // console.log(req.mimeType)

            req.cookie = {};
            const cookieString = req.headers["cookie"];
            const cookie = {};
            if (cookieString) for (const [, name, value] of cookieString.matchAll(/([\s\S]+?)\=([\s\S]+?)(; ?|$)/g)) cookie[name] = value;
            req.cookie = cookie;
            // console.log(req.cookie);

            if (!/\b(GET|DELETE|HEAD)\b/.test(req.method)) {
                const body = [];
                for await (const chunk of req) body.push(chunk);
                body = Buffer.concat(body);
                if (/json/.test(req.mimeType)) req.body = JSON.parse(body);
                else req.body = body.toString();
                // console.log(req.body)
            }

            res.cookie = function (name, value, options = {}) {
                // expires=new Date()
                // maxAge=1
                const setCookie = res.getHeaders()["set-cookie"] || [];
                let { expires, maxAge, domain, path, secure, httpOnly, sameSite } = options;
                const cookie = [`${name}=${value}`];
                if (!value) {
                    expires = new Date(0);
                    maxAge = 0;
                }
                // new Date().toUTCString()//Sat, 06 Aug 2022 04:55:22 GMT
                if (expires) cookie.push(`Expires=${expires.toUTCString()}`);
                if (maxAge) cookie.push(`Max-Age=${maxAge}`);
                if (domain) cookie.push(`Domain=${domain}`);
                if (path) cookie.push(`Path=${path}`);
                if (secure) cookie.push(`Secure`);
                if (httpOnly) cookie.push(`HttpOnly`);
                if (sameSite) cookie.push(`SameSite=${sameSite}`);
                const cookieString = cookie.join("; ");
                setCookie.push(cookieString);
                res.setHeader("Set-Cookie", setCookie);
            };
            // res.cookie("name1", "value1",{
            //     expires:new Date(Date.now()+1000*5)
            // });
            // res.cookie("name2", "value2");
            // res.cookie("name3", "value3");

            res.json = function (value) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(value));
            };
            // res.json({message:'test'})

            for (let i = 0; i < app.routes.length; i++) {
                const { method, regexp, fns } = app.routes[i];
                const passed = (method == ".*" || method == req.method) && regexp.test(req.Url.pathname);

                if (!passed) continue;

                req.params = { ...req.Url.pathname.match(regexp)?.groups };
                // console.log(req.params);

                for (let j = 0; j < fns.length; j++) {
                    const fn = fns[j];
                    try {
                        await new Promise((resolve, reject) => {
                            fn(req, res, (next) => {
                                if (next == undefined) resolve();
                                else reject(next);
                            });
                        });
                    } catch (error) {
                        if (!(error instanceof TypeError)) {
                            throw error;
                        }
                    }
                }
            }

            res.statusCode = 404;
            throw new Error(http.STATUS_CODES[res.statusCode]);
        } catch (err) {
            err = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            const { fns: [fnError] = [] } = app.routes[app.routes.length - 1];
            try {
                fnError(err, req, res, (next) => {});
            } catch (error) {
                if (res.statusCode == 200) res.statusCode = 500;
                res.json(err);
            }
        }
    }

    app.routes = [];

    app.add = function (method, path, ...fns) {
        if (typeof method == "object") ({ method, path, fns } = method);

        if (typeof path == "function") {
            fns = [path, ...fns];
            path = ".*";
        }
        let regexp = path;
        const [{ routes }] = fns;
        if (routes) {
            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];
                route.path = path + route.path;
                app.add(route);
            }
        } else {
            regexp = new RegExp("^" + regexp.replace(/\:(\w+)/g, "(?<$1>[^/]+)").replace(/\/?$/, "/?$"));
            const route = { method, path, regexp, fns };
            app.routes.push(route);
        }
    };

    /**
     * Add middleware
     * @param  {String} path - Optional
     * @param  {Function} args - Set one or more handler
     * @memberof module:Router
     */
    app.use = function (...args) {
        app.add(".*", ...args);
    };

    /**
     * Add middleware
     * @param  {String} path -
     * @param  {Function} args - Set one or more handler
     * @method {post/get/patch/put/delete}
     * @memberof module:Router
     */
    for (let i = 0; i < http.METHODS.length; i++) {
        const method = http.METHODS[i];
        app[method.toLowerCase()] = function (...args) {
            app.add(method, ...args);
        };
    }

    /**
     * Create server
     * @param {Number} port -
     * @param {String} hostname - Optional
     * @param {Function} backlog -
     * @returns {Object}
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

module.exports = Router;
