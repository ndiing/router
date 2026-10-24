const { decodeParam } = require("./util");
const { Node } = require("./node");

/**
 * @typedef {Object} Options
 * @property {Number} requestTimeout
 */

class Router {
    /**
     * @param {Options} options
     */
    constructor(options = {}) {
        this.requestTimeout = options.requestTimeout ?? 0;
        this.root = new Node();
        this.seq = 0;
    }

    /**
     * @param {String} path
     * @returns {String[]}
     */
    split(path) {
        return path.split("/").filter(Boolean);
    }

    /**
     * @param {String} method
     * @param {String|Function} path
     * @param  {Function[]} handlers
     */
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

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    use(path, ...handlers) {
        this.add("ALL", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    get(path, ...handlers) {
        this.add("GET", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    query(path, ...handlers) {
        this.add("QUERY", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    head(path, ...handlers) {
        this.add("HEAD", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    options(path, ...handlers) {
        this.add("OPTIONS", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    trace(path, ...handlers) {
        this.add("TRACE", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    put(path, ...handlers) {
        this.add("PUT", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    delete(path, ...handlers) {
        this.add("DELETE", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    post(path, ...handlers) {
        this.add("POST", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    patch(path, ...handlers) {
        this.add("PATCH", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Function} path
     * @param  {Function[]} handlers
     * @returns {this}
     */
    connect(path, ...handlers) {
        this.add("CONNECT", path, ...handlers);
        return this;
    }

    /**
     * @param {String} method
     * @param {String[]} segments
     * @param {Node} node
     * @param {Array} path
     * @param {Object} params
     * @param {Object} state
     * @param {Number} index
     * @returns {{path:Array,params:Object,matched:Boolean}}
     */
    search(method, segments, node, path = [], params = {}, state = { path: [], params: {} }, index = 0) {
        path.push(node);
        if (index === segments.length) {
            if (node.handlers.has(method) || node.handlers.has("ALL")) {
                return { path, params, matched: true };
            }
            if (path.length > state.path.length) {
                state.path = path.slice();
                state.params = { ...params };
            }
            path.pop();
            return { path: state.path, params: state.params, matched: false };
        }
        const segment = segments[index];
        if (node.children.has(segment)) {
            const res = this.search(method, segments, node.children.get(segment), path, params, state, index + 1);
            if (res.matched) return res;
        }
        if (node.params.size) {
            for (const [, child] of node.params) {
                const prev = params[child.name];
                params[child.name] = decodeParam(segment);
                const res = this.search(method, segments, child, path, params, state, index + 1);
                if (res.matched) return res;
                if (prev === undefined) {
                    const { [child.name]: _, ...rest } = params;
                    params = rest;
                } else params[child.name] = prev;
            }
        }
        if (node.wildcard && (node.wildcard.handlers.get(method) || node.wildcard.handlers.get("ALL"))) {
            params["wildcard"] = segments.slice(index).map(decodeParam).join("/");
            path.push(node.wildcard);
            return { path, params, matched: true };
        }
        if (path.length > state.path.length) {
            state.path = path.slice();
            state.params = { ...params };
        }
        path.pop();
        return { path: state.path, params: state.params, matched: false };
    }

    /**
     * @param {Node} r
     * @param {String} method
     * @param {Object} handlers
     */
    collectHandler(r, method, handlers) {
        if (r.handlers.has(method)) {
            for (const entry of r.handlers.get(method)) {
                handlers[entry.seq] = entry.handler;
            }
        }
    }

    /**
     * @param {Node} r
     * @param {Object} handlers
     * @param {Object} errorHandlers
     */
    collectMiddleware(r, handlers, errorHandlers) {
        this.collectHandler(r, "ALL", handlers);
        this.collectHandler(r, "CATCH", errorHandlers);
    }

    /**
     * @param {String} method
     * @param {String} path
     * @returns {{matched: boolean;params: Object;paramsLength: number;handlers: any[];errorHandlers: any[];}}
     */
    find(method, path) {
        const res = this.search(method, this.split(path), this.root);
        const handlers = {};
        const errorHandlers = {};
        for (const r of res.path) {
            this.collectMiddleware(r, handlers, errorHandlers);
        }
        if (res.matched) {
            this.collectHandler(res.path.at(-1), method, handlers);
        }
        return {
            matched: res.matched,
            params: res.params,
            paramsLength: Object.keys(res.params).length,
            handlers: Object.values(handlers),
            errorHandlers: Object.values(errorHandlers),
        };
    }
}
exports.Router = Router;
