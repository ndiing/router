const { STATUS_CODES, createServer } = require("node:http");
const { Router } = require("./router");
const { Request } = require("./request");
const { Response } = require("./response");
const { json } = require("./middleware/json.js");
const { urlencoded } = require("./middleware/urlencoded.js");
const { cors } = require("./middleware/cors.js");

class App {
    constructor(options = {}) {
        this.requestTimeout = options.requestTimeout ?? 0;
        this.router = new Router();
    }

    use(path, ...handlers) {
        return this.router.use(path, ...handlers);
    }
    get(path, ...handlers) {
        return this.router.get(path, ...handlers);
    }
    query(path, ...handlers) {
        return this.router.query(path, ...handlers);
    }
    head(path, ...handlers) {
        return this.router.head(path, ...handlers);
    }
    options(path, ...handlers) {
        return this.router.options(path, ...handlers);
    }
    trace(path, ...handlers) {
        return this.router.trace(path, ...handlers);
    }
    put(path, ...handlers) {
        return this.router.put(path, ...handlers);
    }
    delete(path, ...handlers) {
        return this.router.delete(path, ...handlers);
    }
    post(path, ...handlers) {
        return this.router.post(path, ...handlers);
    }
    patch(path, ...handlers) {
        return this.router.patch(path, ...handlers);
    }
    connect(path, ...handlers) {
        return this.router.connect(path, ...handlers);
    }

    /**
     * @param {*} req
     * @param {*} res
     * @param {*} handlerPromise
     */
    async withTimeout(req, res, handlerPromise) {
        let handleAbort;
        const timeoutPromise = new Promise((_, reject) => {
            handleAbort = () => reject(req.controller.signal.reason);
            req.controller.signal.addEventListener("abort", handleAbort, { once: true });
        });
        const timeout = setTimeout(() => {
            res.statusCode = 504;
            req.controller.abort(new Error(STATUS_CODES[res.statusCode]));
        }, this.requestTimeout);
        const promise = handlerPromise().catch((error) => {
            if (!req.controller.signal.aborted) {
                req.controller.abort(error);
            } else {
                if (process.env.NODE_ENV === "development") {
                    console.error("Error after timeout:", error);
                }
            }
        });
        try {
            await Promise.race([promise, timeoutPromise]);
        } finally {
            clearTimeout(timeout);
            req.controller.signal.removeEventListener("abort", handleAbort);
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     */
    async handle(req, res) {
        const result = this.router.find(req.method, req.path);
        req.params = result.params;
        /**@type {Error}*/
        let err;
        try {
            const handlerPromise = async () => {
                for (const handler of Object.values(result.handlers)) {
                    if (res.done) break;
                    await handler(req, res);
                }
            };
            if (this.requestTimeout) {
                await this.withTimeout(req, res, handlerPromise);
            } else {
                await handlerPromise();
            }
        } catch (error) {
            err = error;
            try {
                for (const handler of Object.values(result.errorHandlers)) {
                    if (res.done) break;
                    await handler(err, req, res);
                }
            } catch (error) {
                err = new Error(error.message, { cause: err });
            }
        }
        if (!res.done) {
            if (!err) {
                res.status(404);
                err = new Error(STATUS_CODES[res.statusCode]);
            }
            if (res.statusCode < 400) {
                res.status(500);
            }
            const error = {
                message: err.message,
            };
            if (process.env.NODE_ENV === "development") {
                error.stack = err.stack;
            }
            res.json({ error });
        }
    }

    /**
     * @param  {...any} args
     * @returns
     */
    listen(...args) {
        const server = createServer(
            {
                IncomingMessage: Request,
                ServerResponse: Response,
            },
            (req, res) => this.handle(req, res),
        );
        server.listen(...args);
        return server;
    }
}

App.Router = Router;
App.Request = Request;
App.Response = Response;
App.json = json;
App.urlencoded = urlencoded;
App.cors = cors;

exports.App = App;
