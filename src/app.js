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
    async withTimeout(handlerPromise, delay) {
        let timeout;
        const timeoutPromise = new Promise((_, reject) => {
            timeout = setTimeout(() => reject(ErrorResponse.status(504)), delay);
        });

        await Promise.race([handlerPromise, timeoutPromise]).finally(() => clearTimeout(timeout));
    }

    /**
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     */
    async handle(req, res) {
        const { params, handlers, errorHandlers } = this.find(req.method, req.path);
        req.params = params;

        let err;
        try {
            const handlerPromise = (async () => {
                for (const handler of handlers) {
                    if (res.writableEnded) break;
                    await handler(req, res);
                }
            })();

            if (req.timeout) await this.withTimeout(handlerPromise, req.timeout);
            else await handlerPromise;
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

            if (!res.statusCode || res.statusCode < 400) {
                res.statusCode = err.statusCode || 500;
            }

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
