require("./polyfill.js");
const http = require("node:http");
const { Response } = require("./response.js");
const { Request } = require("./request.js");
const { Node } = require("./node.js");

class Router {
    /**@type {Node}*/
    root;

    constructor() {
        this.root = new Node("");
        this.seq = 0;
    }

    split(path) {
        return path.split("/").filter(Boolean);
    }

    add(method, path, handler) {
        if (typeof path === "function") {
            handler = path;
            path = null;
        }

        let node = this.root;

        if (path !== null) {
            for (const segment of this.split(path)) {
                node = node.add(segment);
            }
        }

        if (handler.root) {
            node.merge(handler.root, this.seq);
            this.seq = node.getMaxSeq() + 1;
        } else {
            handler.seq = this.seq++;
            node.handlers.getOrInsert(method, []).push(handler);
        }
    }

    use(path, handler) {
        this.add("ALL", path, handler);
        return this;
    }

    get(path, handler) {
        this.add("GET", path, handler);
        return this;
    }
    query(path, handler) {
        this.add("QUERY", path, handler);
        return this;
    }
    head(path, handler) {
        this.add("HEAD", path, handler);
        return this;
    }
    options(path, handler) {
        this.add("OPTIONS", path, handler);
        return this;
    }
    trace(path, handler) {
        this.add("TRACE", path, handler);
        return this;
    }
    put(path, handler) {
        this.add("PUT", path, handler);
        return this;
    }
    delete(path, handler) {
        this.add("DELETE", path, handler);
        return this;
    }
    post(path, handler) {
        this.add("POST", path, handler);
        return this;
    }
    patch(path, handler) {
        this.add("PATCH", path, handler);
        return this;
    }
    connect(path, handler) {
        this.add("CONNECT", path, handler);
        return this;
    }

    find(method, path) {
        let params = {};
        let handlers = {};
        let errorHandlers = {};

        let node = this.root;

        const inputs = this.split(path);
        if (inputs.length) {
            for (const input of inputs) {
                let matched = node.children.get(input);

                if (!matched) {
                    for (const [, child] of node.children) {
                        const match = child.pattern.exec(input);
                        if (match) {
                            matched = child;
                            Object.assign(params, match.pathname.groups);
                            break;
                        }
                    }
                }

                if (!matched) {
                    node = null;
                    params = {};
                    break;
                }

                node = matched;

                if (node.handlers.has("ALL")) {
                    for (const handler of node.handlers.get("ALL")) {
                        if (handler.length === 3) errorHandlers[handler.seq] = handler;
                        else handlers[handler.seq] = handler;
                    }
                }
            }
        }

        if (this.root.handlers.has("ALL")) {
            for (const handler of this.root.handlers.get("ALL")) {
                if (handler.length === 3) errorHandlers[handler.seq] = handler;
                else handlers[handler.seq] = handler;
            }
        }

        if (node && node.handlers.has(method)) {
            for (const handler of node.handlers.get(method)) {
                if (handler.length === 3) errorHandlers[handler.seq] = handler;
                else handlers[handler.seq] = handler;
            }
        }

        return {
            params,
            handlers: Object.values(handlers),
            errorHandlers: Object.values(errorHandlers),
        };
    }

    /**
     * @param {import('http').RequestOptions} req
     * @param {import('http').ServerResponse} res
     */
    async handleRequest(req, res) {
        const result = this.find(req.method, req.path);
        req.params = result.params;

        try {
            for (const handler of result.handlers) {
                if (res.done) break;
                await handler(req, res);
            }
        } catch (error) {
            res.error = error;

            try {
                for (const handler of result.errorHandlers) {
                    if (res.done) break;
                    await handler(res.error, req, res);
                }
            } catch (error) {
                res.error = error;
            }
        }

        if (!res.done) {
            if (!res.error) {
                res.statusCode = 404;
                res.error = new Error(http.STATUS_CODES[res.statusCode]);
            }

            res.statusCode = res.statusCode >= 200 && res.statusCode < 300 ? 500 : res.statusCode;

            const error = {
                code: res.error.code,
                message: res.error.message,
            };
            if (process.env.NODE_ENV === "development") error.stack = res.error.stack;

            res.json({ error });
        }
    }

    /**
     * @returns {import('http').Server}
     */
    listen(...params) {
        const server = http.createServer(
            {
                IncomingMessage: Request,
                ServerResponse: Response,
            },
            (req, res) => this.handleRequest(req, res),
        );

        server.listen(...params);

        return server;
    }
}

module.exports = Router;
