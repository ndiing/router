const http = require("http");
const { Router } = require("./router");
const { Request } = require("./request");
const { Response } = require("./response");
const { json } = require("./middleware/json");
const { cors } = require("./middleware/cors");
const { urlencoded } = require("./middleware/urlencoded");

class App extends Router {
    /**
     * @param {Request} req
     * @param {Response} res
     * @param {Promise} handlerPromise
     */
    async withTimeout(req, res, handlerPromise) {
        let handleAbort;
        const timeoutPromise = new Promise((_, reject) => {
            handleAbort = () => reject(req.controller.signal.reason);
            req.controller.signal.addEventListener("abort", handleAbort, { once: true });
        });
        const timeout = setTimeout(() => {
            res.statusCode = 504;
            req.controller.abort(new Error(http.STATUS_CODES[res.statusCode]));
        }, this.requestTimeout);
        const promise = handlerPromise().catch((error) => {
            if (!req.controller.signal.aborted) {
                req.controller.abort(error);
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
     * @param {Error} err
     * @param {Response} res
     */
    fallback(err, res) {
        if (!res.done) {
            if (!err) {
                res.statusCode = 404;
                err = new Error(http.STATUS_CODES[res.statusCode]);
            }
            if (res.statusCode < 400) {
                res.statusCode = 500;
            }
            const error = { message: err.message };
            if (process.env.NODE_ENV === "development") {
                error.stack = err.stack;
            }
            res.json({ error });
        }
    }

    /**
     * @param {Request} req
     * @param {Response} res
     */
    async handle(req, res) {
        const result = this.find(req.method, req.path);
        req.params = result.params;
        let err;
        try {
            const handlerPromise = async () => {
                for (const handler of result.handlers) {
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
                for (const handler of result.errorHandlers) {
                    if (res.done) break;
                    await handler(err, req, res);
                }
            } catch (error) {
                err = new Error(error.message, { cause: err });
            }
        }
        this.fallback(err, res);
    }

    /**
     * @param  {import('net').ListenOptions} args
     * @returns {import('http').Server}
     */
    listen(...args) {
        const server = http.createServer(
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
App.json = json;
App.cors = cors;
App.urlencoded = urlencoded;

exports.App = App;
