const http = require("http");
const { App } = require("../src/app");
require("../src/polyfill");

/**
 * Start server di port random, return { baseUrl, close }
 */
function startServer(app) {
    return new Promise((resolve) => {
        const server = http.createServer(
            {
                IncomingMessage: require("../src/request").Request,
                ServerResponse: require("../src/response").Response,
            },
            (req, res) => app.handle(req, res),
        );
        server.listen(0, "127.0.0.1", () => {
            const { port } = server.address();
            resolve({
                baseUrl: `http://127.0.0.1:${port}`,
                port,
                close: () => new Promise((r) => server.close(r)),
            });
        });
    });
}

module.exports = { startServer };
