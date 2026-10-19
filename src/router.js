const { decodeParam } = require("./util");
const { Node } = require("./node");
const { Cache } = require("./cache");

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
            for (const segment of this.split(path)) {
                node = node.add(segment);
            }
        }

        for (const handler of handlers) {
            if (handler.root) {
                node.merge(handler.root, this.seq);
                this.seq += handler.root.getMaxSeq() + 1;
            } else {
                const key = handler.length === 3 ? "CATCH" : method;
                node.handlers.getOrInsert(key, []).push({
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

    /**
     * @param {Node} node
     * @param {string[]} segments
     * @param {number} index
     * @param {Node[]} path
     * @param {Record<string, string>} params
     * @param {{ best: { nodes: Node[], params: Record<string, string> } }} state
     * @returns {{ nodes: Node[], params: Record<string, string>, matched: boolean }}
     */
    search(node, segments, index, path, params, state) {
        path.push(node);

        // habis segmen -> full match
        if (index === segments.length) {
            return { nodes: path.slice(), params: { ...params }, matched: true };
        }

        const segment = segments[index];

        // 1. static (prioritas tertinggi)
        const staticChild = node.children.get(segment);
        if (staticChild) {
            const res = this.search(staticChild, segments, index + 1, path, params, state);
            if (res.matched) return res;
        }

        // 2. semua param child (bisa lebih dari satu)
        for (const [key, child] of node.params) {
            const name = key.slice(1); // buang ':'
            const prev = params[name];
            params[name] = decodeParam(segment);
            const res = this.search(child, segments, index + 1, path, params, state);
            if (res.matched) return res;
            // backtrack param value
            if (prev === undefined) delete params[name];
            else params[name] = prev;
        }

        // 3. wildcard (prioritas terendah, menyerap sisa segmen)
        if (node.wildcard) {
            const rest = segments.slice(index).join("/");
            params["wildcard"] = decodeParam(rest);
            path.push(node.wildcard);
            return { nodes: path.slice(), params: { ...params }, matched: true };
        }

        // tidak match di sini -> update partial terpanjang
        // path.length > state.best.nodes.length artinya kita sudah lebih dalam
        if (path.length > state.best.nodes.length) {
            state.best = { nodes: path.slice(), params: { ...params } };
        }

        path.pop();
        return { matched: false };
    }

    collectHandler(r, method, handlers) {
        if (r.handlers.has(method)) {
            for (const entry of r.handlers.get(method)) {
                handlers[entry.seq] = entry.handler;
            }
        }
    }

    collectErrorHandler(r, errorHandlers) {
        if (r.handlers.has("CATCH")) {
            for (const entry of r.handlers.get("CATCH")) {
                errorHandlers[entry.seq] = entry.handler;
            }
        }
    }

    collectMiddleware(r, handlers, errorHandlers) {
        this.collectHandler(r, "ALL", handlers);
        this.collectErrorHandler(r, errorHandlers);
    }

    find(method, path) {
        const key = `${method} ${path}`;

        const cached = this.cache.get(key);
        if (cached) return cached;

        const segments = this.split(path);

        const params = {};
        const handlers = {};
        const errorHandlers = {};

        /** @type {{ best: { nodes: Node[], params: Record<string, string> } }} */
        const state = { best: { nodes: [], params: {} } };

        const res = this.search(this.root, segments, 0, [], params, state);

        const matchedNodes = res.matched ? res.nodes : state.best.nodes;
        const finalParams = res.matched ? res.params : state.best.params;

        // middleware dari semua node di jalur (partial atau full)
        for (const r of matchedNodes) {
            this.collectMiddleware(r, handlers, errorHandlers);
        }

        // method handler HANYA kalau full match
        if (res.matched) {
            const leaf = matchedNodes[matchedNodes.length - 1];
            this.collectHandler(leaf, method, handlers);
        }

        Object.freeze(finalParams);

        const result = {
            matched: res.matched,
            params: finalParams,
            paramsLength: Object.keys(finalParams).length,
            handlers: Object.values(handlers),
            errorHandlers: Object.values(errorHandlers),
        };

        this.cache.set(key, result);

        return result;
    }
}
exports.Router = Router;
