const { decodeParam } = require("./util");
const { Node } = require("./node");

/**
 * @callback Callback
 * @param {import('./request').Request} req
 * @param {import('./response').Response} res
 */

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
        for (const [prefix, child] of node.children) {
            const lcp = this.lcp(prefix, path);
            if (lcp === 0) continue;
            if (lcp === prefix.length) {
                if (lcp === path.length) return child;
                return this.walk(path.slice(lcp), child);
            }
            const newNode = new Node(prefix.slice(0, lcp));
            newNode.add(prefix.slice(lcp)).merge(child);
            const rest = path.slice(lcp);
            if (rest.length) newNode.add(rest);
            node.add(newNode.prefix).merge(newNode);
            node.remove(prefix);
        }
        return node.add(path);
    }

    /**
     * @param {String} method
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     */
    add(method, path, ...handlers) {
        if (typeof path === "function") {
            handlers = [path, ...handlers];
            path = null;
        }
        let node = this.root;
        if (path) {
            let i = 0;
            while (i < path.length) {
                if (path[i] === ":") {
                    let j = i + 1;
                    while (j < path.length && path[j] !== "/") j++;
                    let prefix = path.slice(i, j);
                    node = node.add(prefix);
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
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    use(path, ...handlers) {
        this.add("ALL", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    get(path, ...handlers) {
        this.add("GET", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    query(path, ...handlers) {
        this.add("QUERY", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    head(path, ...handlers) {
        this.add("HEAD", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    options(path, ...handlers) {
        this.add("OPTIONS", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    trace(path, ...handlers) {
        this.add("TRACE", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    put(path, ...handlers) {
        this.add("PUT", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    delete(path, ...handlers) {
        this.add("DELETE", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    post(path, ...handlers) {
        this.add("POST", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
     * @returns {this}
     */
    patch(path, ...handlers) {
        this.add("PATCH", path, ...handlers);
        return this;
    }

    /**
     * @param {String|Callback} path
     * @param  {Callback[]} handlers
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
    search(method, path, node = this.root, nodes = [], params = {}, state = { nodes: [], params: {} }) {
        nodes.push(node);
        if (0 === path.length) {
            if (node.handlers.has(method) || node.handlers.has("ALL")) {
                return { nodes, params, matched: true };
            }
            if (nodes.length > state.nodes.length) {
                state.nodes = nodes.slice();
                state.params = { ...params };
            }
            nodes.pop();
            return { nodes: state.nodes, params: state.params, matched: false };
        }
        if (node.children.size) {
            for (const [prefix, child] of node.children) {
                if (path.startsWith(prefix)) {
                    const res = this.search(method, path.slice(prefix.length), child, nodes, params, state);
                    if (res.matched) return res;
                }
            }
        }
        if (node.params.size) {
            for (const [, child] of node.params) {
                const slashIdx = path.indexOf("/");
                const value = slashIdx === -1 ? path : path.slice(0, slashIdx);
                if (value.length) {
                    const rest = slashIdx === -1 ? "" : path.slice(slashIdx);
                    const next = { ...params, [child.name]: value };
                    const result = this.search(method, rest, child, nodes, next, state);
                    if (result.matched) return result;
                }
            }
        }
        if (node.wildcard && (node.wildcard.handlers.get(method) || node.wildcard.handlers.get("ALL"))) {
            nodes.push(node.wildcard);
            return { nodes, params: { ...params, wildcard: path }, matched: true };
        }
        if (nodes.length > state.nodes.length) {
            state.nodes = nodes.slice();
            state.params = { ...params };
        }
        nodes.pop();
        return { nodes: state.nodes, params: state.params, matched: false };
    }

    /**
     * @param {Node} node
     * @param {String} method
     * @param {Object} handlers
     */
    collectHandler(node, method, handlers) {
        if (node.handlers.has(method)) {
            for (const entry of node.handlers.get(method)) {
                handlers[entry.seq] = entry.handler;
            }
        }
    }

    /**
     * @param {Node} node
     * @param {Object} handlers
     * @param {Object} errorHandlers
     */
    collectMiddleware(node, handlers, errorHandlers) {
        this.collectHandler(node, "ALL", handlers);
        this.collectHandler(node, "CATCH", errorHandlers);
    }

    decodeParams(obj) {
        const params = Object.create(null);
        const keys = Object.keys(obj);
        if (keys.length) {
            for (const key of keys) {
                params[key] = decodeParam(obj[key]);
            }
        }
        return params;
    }

    /**
     * @param {String} method
     * @param {String} path
     * @returns {{params: Object;handlers: any[];errorHandlers: any[];}}
     */
    find(method, path) {
        let res = this.search(method, path);
        if (!res.matched && path.length > 1) {
            const alt = path.endsWith("/") ? path.slice(0, -1) : path + "/";
            res = this.search(method, alt);
        }
        const handlers = {};
        const errorHandlers = {};
        if (res.matched) {
            this.collectHandler(res.nodes.at(-1), method, handlers);
        }
        for (const node of res.nodes) {
            this.collectMiddleware(node, handlers, errorHandlers);
        }
        return {
            params: this.decodeParams(res.params),
            handlers: Object.values(handlers),
            errorHandlers: Object.values(errorHandlers),
        };
    }
}
exports.Router = Router;
