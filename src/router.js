const { Node } = require("./node.js");
const { Cache } = require("./cache.js");
const { decodePathParam } = require("./util.js");

class Router {
    constructor(options = {}) {
        this.requestTimeout = options.requestTimeout ?? 0;
        this.cacheSize = options.cacheSize ?? 1000;
        this.root = new Node();
        this.seq = 0;
        this.cache = new Cache(this.cacheSize);
    }

    split(path) {
        return path.split("/").filter(Boolean);
    }

    add(method, path, ...handlers) {
        this.cache.clear();

        if (typeof path === "function") {
            handlers = [path, ...handlers];
            path = null;
        }
        let node = this.root;
        if (path) {
            for (const part of this.split(path)) {
                node = node.add(part);
            }
        }

        for (const handler of handlers) {
            if (handler.root) {
                node.merge(handler.root, this.seq);
                this.seq += handler.root.getMaxSeq() + 1;
            } else {
                const newMethod = handler.length === 3 ? "CATCH" : method;
                node.handlers.getOrInsert(newMethod, []).push({
                    handler,
                    seq: this.seq++,
                });
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

    collectMiddleware(node, handlers, errorHandlers) {
        if (node.handlers.has("ALL")) {
            for (const entry of node.handlers.get("ALL")) {
                handlers[entry.seq] = entry.handler;
            }
        }
        if (node.handlers.has("CATCH")) {
            for (const entry of node.handlers.get("CATCH")) {
                errorHandlers[entry.seq] = entry.handler;
            }
        }
    }

    collectHandler(node, method, handlers) {
        if (node && node.handlers.has(method)) {
            for (const entry of node.handlers.get(method)) {
                handlers[entry.seq] = entry.handler;
            }
        }
    }

    /**
     * @param {Node} node
     * @param {*} parts
     * @param {*} i
     * @param {*} params
     * @param {*} path
     * @returns
     */
    search(node, parts, i, params, path) {
        if (!node) return null;
        path.push(node);
        if (i === parts.length) return path;

        const part = parts[i];

        if (node.staticChildren.has(part)) {
            const r = this.search(node.staticChildren.get(part), parts, i + 1, params, path);
            if (r) return r;
        }

        if (node.paramChild) {
            const saved = params[node.paramChild.paramName];
            params[node.paramChild.paramName] = decodePathParam(part);
            const r = this.search(node.paramChild, parts, i + 1, params, path);
            if (r) return r;
            if (saved === undefined) delete params[node.paramChild.paramName];
            else params[node.paramChild.paramName] = saved;
        }

        if (node.wildcardChild) {
            params[0] = decodePathParam(parts.slice(i).join("/"));
            path.push(node.wildcardChild);
            return path;
        }

        path.pop();
        return null;
    }

    find(method, path) {
        const key = `${method} ${path}`;
        const cached = this.cache.get(key);
        if (cached) return cached;

        const parts = this.split(path);
        const params = {};
        const nodePath = [];
        const result = this.search(this.root, parts, 0, params, nodePath);

        const handlers = {};
        const errorHandlers = {};

        if (result) {
            for (const n of result) {
                this.collectMiddleware(n, handlers, errorHandlers);
            }
            this.collectHandler(result[result.length - 1], method, handlers);
        } else {
            this.collectMiddleware(this.root, handlers, errorHandlers);
        }

        const value = {
            params,
            handlers: Object.values(handlers),
            errorHandlers: Object.values(errorHandlers),
        };
        this.cache.set(key, value);

        return value;
    }
}
exports.Router = Router;
