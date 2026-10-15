const http = require("node:http");
const { Router } = require("./router.js");
const { Request } = require("./request.js");
const { Response } = require("./response.js");
const { ErrorResponse } = require("./error.js");

/**@type {import('http').ServerOptions}*/
const SERVER_OPTIONS = {
    IncomingMessage: Request,
    ServerResponse: Response,
};

class App extends Router {
    async withTimeout(req, handlerPromise) {
        const controller = new AbortController();
        const { signal } = controller;

        req.signal = signal;

        const timeout = setTimeout(() => {
            controller.abort(ErrorResponse.status(504));
        }, this.timeout);

        let handleAbort;
        const timeoutPromise = new Promise((_, reject) => {
            handleAbort = () => reject(signal.reason);
            signal.addEventListener("abort", handleAbort, { once: true });
        });

        const promise = handlerPromise().catch((error) => {
            if (!signal.aborted) {
                controller.abort(error);
            }
        });

        await Promise.race([promise, timeoutPromise]).finally(() => {
            signal.removeEventListener("abort", handleAbort);
            clearTimeout(timeout);
        });
    }

    /**
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     */
    async handle(req, res) {
        const { params, handlers, errorHandlers } = this.find(req.method, req.path);
        req.params = Object.assign(Object.create(null), params);
        let err;
        try {
            const handlerPromise = async () => {
                for (const handler of handlers) {
                    if (res.writableEnded) break;
                    await handler(req, res);
                }
            };
            if (this.timeout) await this.withTimeout(req, handlerPromise);
            else await handlerPromise();
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
        if (!res.writableEnded) {
            if (!err) err = ErrorResponse.status(404);
            res.statusCode = err.statusCode || 500;
            const error = { message: err.message };
            if (process.env.NODE_ENV === "development") {
                error.stack = err.stack;
            }
            res.json({ error });
        }
    }

    listen(...params) {
        const requestListener = (req, res) => this.handle(req, res);
        const server = http.createServer(SERVER_OPTIONS, requestListener);
        server.listen(...params);
        return server;
    }
}

App.SERVER_OPTIONS = SERVER_OPTIONS;

exports.App = App;
