const http = require("node:http");
const { Response } = require("./response.js");
const { Request } = require("./request.js");
const { Router } = require("./Router.js");

class App extends Router {
    /**
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     */
    async handleRequest(req, res) {
        let err;

        const { params, handlers, errorHandlers } = this.find(req.method, req.path);
        req.params = params;

        try {
            for (const handler of handlers) {
                if (res.done) break;
                await handler(req, res);
            }
        } catch (error) {
            err = error;

            try {
                for (const handler of errorHandlers) {
                    if (res.done) break;
                    await handler(err, req, res);
                }
            } catch (error) {
                err = error;
            }
        }

        if (!res.done) {
            if (!err) {
                res.statusCode = 404;
                err = new Error(http.STATUS_CODES[res.statusCode]);
            }

            res.statusCode = res.statusCode >= 200 && res.statusCode < 300 ? 500 : res.statusCode;
            const error = { message: err.message };
            if (process.env.NODE_ENV === "development") error.stack = err.stack;
            res.json({ error });
        }
    }

    /**
     * @param {import('net').ListenOptions} options
     * @returns {import('http').Server}
     */
    listen(options = {}, callback) {
        const serverOptions = {
            IncomingMessage: Request,
            ServerResponse: Response,
        };
        const requestListener = (req, res) => this.handleRequest(req, res);

        const server = http.createServer(serverOptions, requestListener);

        server.listen(options, callback);

        return server;
    }
}

module.exports = App;
