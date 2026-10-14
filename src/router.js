const { Node } = require("./node.js");
const { Cache } = require("./cache.js");

class Router {
    constructor(options = {}) {
        this.cacheSize = options.size ?? 1000;

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
                this.seq = node.getMaxSeq() + 1;
            } else {
                handler.seq = this.seq++;
                node.handlers.getOrInsert(method,[]).push(handler);
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
                for (const [, child] of node.children) {
                    if (!child.pattern) continue;
                    const match = child.pattern.exec(input);
                    if (match) {
                        matched = child;
                        for (const name in match.groups) {
                            const raw = match.groups[name];
                            try {
                                params[name] = decodeURIComponent(raw);
                            } catch {
                                params[name] = raw;
                            }
                        }
                        break;
                    }
                }
            }

            if (!matched) {
                node = null;
                params = Object.create(null);
                break;
            }

            node = matched;

            if(node.handlers.has("ALL"))
            for (const handler of node.handlers.get("ALL")) {
                if (handler.length === 3) errorHandlers[handler.seq] = handler;
                else handlers[handler.seq] = handler;
            }
        }

        if(this.root.handlers.has("ALL"))
        for (const handler of this.root.handlers.get("ALL")) {
            if (handler.length === 3) errorHandlers[handler.seq] = handler;
            else handlers[handler.seq] = handler;
        }

        if (node&&node.handlers.has(method)) {
            for (const handler of node.handlers.get(method)) {
                handlers[handler.seq] = handler;
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
