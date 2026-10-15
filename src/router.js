const { Node } = require("./node.js");
const { Cache } = require("./cache.js");
const {  decodePathParam } = require("./util.js");

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
                this.seq += handler.root.getMaxSeq() + 1;
            } else {
                node.handlers.getOrInsert(method, []).push({
                    handler,
                    seq: this.seq++,
                    isErrorHandler: handler.length === 3,
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

    matchRegExp(node, input, params) {
        let matched;
        for (const [, child] of node.children) {
            if (!child.pattern) continue;
            const match = child.pattern.exec(input);
            if (match) {
                matched = child;
                for (const name in match.groups) {
                    params[name] = decodePathParam(match.groups[name]);
                }
                break;
            }
        }
        return matched;
    }

    /**
     * @param {'GET'|'QUERY'|'HEAD'|'OPTIONS'|'TRACE'|'PUT'|'DELETE'|'POST'|'PATCH'|'CONNECT'} method
     * @param {String} path
     * @returns {{params: {};handlers: any[];errorHandlers: any[];}}
     */
    find(method, path) {
        const key = `${method} ${path}`;
        const cached = this.cache.get(key);
        if (cached) return cached;
        let node = this.root;
        let params = Object.create(null);
        const handlers = {};
        const errorHandlers = {};
        for (const input of this.split(path)) {
            let matched = node.children.get(input);
            if (!matched && node.hasRegExpChildren) {
                matched = this.matchRegExp(node, input, params);
            }
            if (!matched) {
                node = null;
                params = Object.create(null);
                break;
            }
            node = matched;
            if (node.handlers.has("ALL")) {
                for (const entry of node.handlers.get("ALL")) {
                    if (entry.isErrorHandler) errorHandlers[entry.seq] = entry.handler;
                    else handlers[entry.seq] = entry.handler;
                }
            }
        }
        if (this.root.handlers.has("ALL")) {
            for (const entry of this.root.handlers.get("ALL")) {
                if (entry.isErrorHandler) errorHandlers[entry.seq] = entry.handler;
                else handlers[entry.seq] = entry.handler;
            }
        }
        if (node && node.handlers.has(method)) {
            for (const entry of node.handlers.get(method)) {
                handlers[entry.seq] = entry.handler;
            }
        }
        const result = {
            params,
            handlers: Object.values(handlers),
            errorHandlers: Object.values(errorHandlers),
        };
        this.cache.set(key, result);
        return result;
    }
}
exports.Router = Router;
