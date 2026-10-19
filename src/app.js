const http = require("http");
const { EMPTY_PARAMS } = require("./util");
const { Router } = require("./router");
const { Request } = require("./request");
const { Response } = require("./response");

/**@type {import('http').ServerOptions}*/
const SERVER_OPTIONS = {
    IncomingMessage: Request,
    ServerResponse: Response,
};

class App extends Router {
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
            } else {
                console.error(error); // swallow error?
            }
        });

        try {
            await Promise.race([promise, timeoutPromise]);
        } finally {
            clearTimeout(timeout);
            req.controller.signal.removeEventListener("abort", handleAbort);
        }
    }

    fallback(res, err) {
        if (!res.writableEnded) {
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
     * @param {import('http').IncomingMessage & import('./request').Request} req
     * @param {import('http').ServerResponse & import('./response').Response} res
     */
    async handle(req, res) {
        const { params, paramsLength, handlers, errorHandlers } = this.find(req.method, req.path);
        req.params = paramsLength ? Object.assign(Object.create(null), params) : EMPTY_PARAMS;

        let err;
        try {
            const handlerPromise = async () => {
                for (const handler of handlers) {
                    if (res.writableEnded) break;
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
                for (const handler of errorHandlers) {
                    if (res.writableEnded) break;
                    await handler(err, req, res);
                }
            } catch (error) {
                err = new Error(error.message, { cause: err });
            }
        }

        this.fallback(res, err);
    }

    listen(...args) {
        const requestListener = (req, res) => this.handle(req, res);
        const server = http.createServer(SERVER_OPTIONS, requestListener);
        server.listen(...args);
        return server;
    }
}

App.SERVER_OPTIONS=SERVER_OPTIONS

exports.App = App;
