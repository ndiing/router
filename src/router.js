const { Node } = require("./node");
const { Cache } = require("./cache");

/**
 * @callback Handler
 * @param {*} req
 * @param {*} res
 */
/**
 * @callback Middleware
 * @param {*} req
 */
/**
 * @callback ErrorHandler
 * @param {*} err
 * @param {*} req
 * @param {*} res
 */
/**
 * @typedef {Handler|Middleware|ErrorHandler} FunctionHandler
 */

class Router {
    constructor(options = {}) {
        this.cacheSize = options.cacheSize ?? 30_000;

        this.root = new Node("/");
        this.seq = 0;
        this.cache = new Cache(this.cacheSize);
    }

    split(path) {
        if (path === "/") return [];

        return path.split("/").filter(Boolean);
    }

    /**
     * @param {*} method
     * @param {*} path
     * @param {FunctionHandler[]} handler
     */
    add(method, path, ...handlers) {
        if (typeof path === "function") {
            handlers = [path, ...handlers];
            path = null;
        }

        let node = this.root;

        if (path !== null) {
            for (const segment of this.split(path)) {
                node = node.add(segment);
            }
        }

        for (const handler of handlers) {
            if (handler.root) {
                node.merge(handler.root, this.seq);
                this.seq = node.getMaxSeq() + 1;
            } else {
                handler.seq = this.seq++;
                node.handlers.get(method).push(handler);
            }
        }
    }

    use(path, ...handlers) {
        this.add("ALL", path, ...handlers);
        return this;
    }

    get(path, ...handlers) {
        this.add("GET", path, ...handlers);
        return this;
    }

    query(path, ...handlers) {
        this.add("QUERY", path, ...handlers);
        return this;
    }

    head(path, ...handlers) {
        this.add("HEAD", path, ...handlers);
        return this;
    }

    options(path, ...handlers) {
        this.add("OPTIONS", path, ...handlers);
        return this;
    }

    trace(path, ...handlers) {
        this.add("TRACE", path, ...handlers);
        return this;
    }

    put(path, ...handlers) {
        this.add("PUT", path, ...handlers);
        return this;
    }

    delete(path, ...handlers) {
        this.add("DELETE", path, ...handlers);
        return this;
    }

    post(path, ...handlers) {
        this.add("POST", path, ...handlers);
        return this;
    }

    patch(path, ...handlers) {
        this.add("PATCH", path, ...handlers);
        return this;
    }

    connect(path, ...handlers) {
        this.add("CONNECT", path, ...handlers);
        return this;
    }

    find(method, path) {
        const key = `${method} ${path}`;

        const cached = this.cache.get(key);
        if (cached) return cached;

        let node = this.root;

        let params = {};
        const handlers = {};
        const errorHandlers = {};

        for (const input of this.split(path)) {
            let matched = node.children.get(input);

            if (!matched) {
                for (const [, child] of node.children) {
                    const match = child.pattern.exec(input);
                    if (match) {
                        matched = child;
                        Object.assign(params, match.groups);
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

            for (const handler of node.handlers.get("ALL")) {
                if (handler.length === 3) errorHandlers[handler.seq] = handler;
                else handlers[handler.seq] = handler;
            }
        }

        for (const handler of this.root.handlers.get("ALL")) {
            if (handler.length === 3) errorHandlers[handler.seq] = handler;
            else handlers[handler.seq] = handler;
        }

        if (node) {
            for (const handler of node.handlers.get(method)) {
                handlers[handler.seq] = handler;
            }
        }

        const value = { params, handlers: Object.values(handlers), errorHandlers: Object.values(errorHandlers) };
        this.cache.set(key, value);
        return value;
    }
}
module.exports.Router = Router;
