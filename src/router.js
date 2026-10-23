const { decodeParam } = require("./util");
const { Node } = require("./node");

class Router {
    constructor(options = {}) {
        this.requestTimeout = options.requestTimeout ?? 0;
        this.root = new Node();
        this.seq = 0;
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
    search(node, segments, index, path, params, state, method) {
        path.push(node);
        if (index === segments.length) {
            if (node.handlers.has(method)) {
                return { nodes: path.slice(), params: { ...params }, matched: true };
            }
            if (path.length > state.best.nodes.length) {
                state.best = { nodes: path.slice(), params: { ...params } };
            }
            path.pop();
            return { matched: false };
        }
        const segment = segments[index];
        const staticChild = node.children.get(segment);
        if (staticChild) {
            const res = this.search(staticChild, segments, index + 1, path, params, state, method);
            if (res.matched) return res;
        }
        for (const [key, child] of node.params) {
            const name = key.slice(1);
            const prev = params[name];
            params[name] = decodeParam(segment);
            const res = this.search(child, segments, index + 1, path, params, state, method);
            if (res.matched) return res;
            if (prev === undefined) delete params[name];
            else params[name] = prev;
        }
        if (node.wildcard) {
            const rest = segments.slice(index).join("/");
            params["wildcard"] = decodeParam(rest);
            path.push(node.wildcard);
            return { nodes: path.slice(), params: { ...params }, matched: true };
        }
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
        const segments = this.split(path);
        const params = {};
        const handlers = {};
        const errorHandlers = {};
        /** @type {{ best: { nodes: Node[], params: Record<string, string> } }} */
        const state = { best: { nodes: [], params: {} } };
        const res = this.search(this.root, segments, 0, [], params, state, method);
        const matchedNodes = res.matched ? res.nodes : state.best.nodes;
        const finalParams = res.matched ? res.params : state.best.params;
        for (const r of matchedNodes) {
            this.collectMiddleware(r, handlers, errorHandlers);
        }
        if (res.matched) {
            const leaf = matchedNodes[matchedNodes.length - 1];
            this.collectHandler(leaf, method, handlers);
        }
        return {
            matched: res.matched,
            params: finalParams,
            paramsLength: Object.keys(finalParams).length,
            handlers: Object.values(handlers),
            errorHandlers: Object.values(errorHandlers),
        };
    }
}
exports.Router = Router;
