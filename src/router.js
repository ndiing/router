const { decodeParam } = require("./util");
const { Node } = require("./node");

/**
 * @typedef {Object} Options
 * @property {Number} [requestTimeout=0]
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
     *
     * @param {*} a
     * @param {*} b
     * @returns
     */
    lcp(a, b) {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return i;
    }

    /**
     *
     * @param {*} path
     * @param {*} node
     * @returns
     */
    walk(path, node) {
        for (const [segment, child] of node.children) {
            const lcp = this.lcp(segment, path);
            if (lcp === 0) continue;
            if (lcp === segment.length) {
                if (lcp === path.length) return child;
                return this.walk(path.slice(lcp), child);
            }
            const newNode = new Node(segment.slice(0, lcp));
            newNode.add(segment.slice(lcp)).merge(child);
            const rest = path.slice(lcp);
            if (rest.length) newNode.add(rest);
            node.add(newNode.segment).merge(newNode);
            node.remove(segment);
        }
        return node.add(path);
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
        let params = [];
        if (path) {
            let i = 0;
            while (i < path.length) {
                if (path[i] === ":") {
                    let j = i + 1;
                    while (j < path.length && path[j] !== "/") j++;
                    let segment = path.slice(i, j);
                    node = node.add(segment);
                    params.push(segment.slice(1));
                    i = j;
                } else if (path[i] === "*") {
                    let j = i + 1;
                    while (j < path.length && path[j] !== "/") j++;
                    node = node.add(path.slice(i, j));
                    i = j;
                } else {
                    let j = i + 1;
                    while (j < path.length && path[j] !== "/" && path[j] !== ":" && path[j] !== "*") j++;
                    node = this.walk(path.slice(i, j), node);
                    i = j;
                }
            }
        }
        for (const handler of handlers) {
            if (handler.root) {
                node.merge(handler.root, this.seq);
                this.seq += handler.root.getMaxSeq() + 1;
            } else {
                const newMethod = handler.length === 3 ? "CATCH" : method;
                node.handlers.getOrInsert(newMethod, []).push({ handler, seq: this.seq++ });
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
     * @returns {{path:Array,params:Object,matched:Boolean}}
     */
    search(method, path, node, nodes = [], params = {}, state = { nodes: [], params: {} }) {
        nodes.push(node);
        if (0 === path.length) {
            if (node.handlers.has(method) || node.handlers.has("ALL")) {
                return { nodes, params, matched: true };
            }
            if (nodes.length > state.nodes.length) {
                state = { nodes: nodes.slice(), params: { ...params } };
            }
            nodes.pop();
            return { nodes: state.nodes, params: state.params, matched: false };
        }
        for (const [segment, child] of node.children) {
            if (path.startsWith(segment)) {
                const res = this.search(method, path.slice(segment.length), child, nodes, params, state);
                if (res.matched) return res;
            }
        }
        for (const [segment, child] of node.params) {
            const slashIdx = path.indexOf("/");
            const value = slashIdx === -1 ? path : path.slice(0, slashIdx);
            const rest = slashIdx === -1 ? "" : path.slice(slashIdx);
            if (value.length > 0) {
                const next = { ...params, [child.name]: decodeParam(value) };
                const result = this.search(method, rest, child, nodes, next, state);
                if (result.matched) return result;
            }
        }
        if (node.wildcard && (node.wildcard.handlers.get(method) || node.wildcard.handlers.get("ALL"))) {
            nodes.push(node.wildcard);
            return {
                nodes,
                params: { ...params, wildcard: path },
                matched: true,
            };
        }
        if (nodes.length > state.nodes.length) {
            state = { nodes: nodes.slice(), params: { ...params } };
        }
        nodes.pop();
        return { nodes: state.nodes, params: state.params, matched: false };
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
        let res = this.search(method, path, this.root);

        if (!res.matched && path.length > 1) {
            const alt = path.endsWith("/") ? path.slice(0, -1) : path + "/";
            res = this.search(method, alt, this.root);
        }
        const handlers = {};
        const errorHandlers = {};
        for (const r of res.nodes) {
            this.collectMiddleware(r, handlers, errorHandlers);
        }
        if (res.matched) {
            this.collectHandler(res.nodes.at(-1), method, handlers);
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
