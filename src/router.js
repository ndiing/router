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
        let i = 0;
        while (i < path.length) {
            const child = node.children.get(path[i]);
            if (!child) {
                const leaf = node.add(path.slice(i));
                return leaf;
            }

            const lcp = this.lcp(child.prefix, path.slice(i));

            // child.prefix habis cocok -> turun
            if (lcp === child.prefix.length) {
                i += lcp;
                node = child;
                continue;
            }

            // split di common prefix
            const split = new Node(child.prefix.slice(0, lcp));
            child.prefix = child.prefix.slice(lcp);
            split.children.set(child.prefix[0], child);
            node.children.set(split.prefix[0], split);

            const rest = path.slice(i + lcp);
            if (rest.length) {
                const leaf = new Node(rest);
                split.children.set(rest[0], leaf);
                return leaf;
            }
            return split;
        }
        return node;
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
                    node = node.add(path.slice(i, j));
                    i = j;
                } else if (path[i] === "*") {
                    node = node.add("*");
                    i++;
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
                const m = handler.length === 3 ? "CATCH" : method;
                node.handlers.getOrInsert(m, []).push({ handler, seq: this.seq++ });
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
    search(method, path, node = this.root, nodes = [], params = {}, state = { nodes: [], params: {}, len: -1 }) {
        nodes.push(node);

        if (path.length === 0) {
            if (node.handlers.has(method) || node.handlers.has("ALL")) {
                return { nodes, params, matched: true };
            }
            if (nodes.length > state.len) {
                state.nodes = nodes.slice();
                state.params = { ...params };
                state.len = nodes.length;
            }
            nodes.pop();
            return { nodes: state.nodes, params: state.params, matched: false };
        }

        // 1. literal (single char)
        const child = node.children.get(path[0]); // O(1)
        if (child) {
            const lcp = this.lcp(child.prefix, path);
            if (lcp === child.prefix.length) {
                const res = this.search(method, path.slice(lcp), child, nodes, params, state);
                if (res.matched) return res;
            }
        }

        // 2. param (coba semua)
        if (node.params.size) {
            const slash = path.indexOf("/");
            const value = slash === -1 ? path : path.slice(0, slash);
            if (value.length) {
                const rest = slash === -1 ? "" : path.slice(slash);
                for (const child of node.params.values()) {
                    const next = { ...params, [child.name]: value };
                    const res = this.search(method, rest, child, nodes, next, state);
                    if (res.matched) return res;
                }
            }
        }

        // 3. wildcard
        if (node.wildcard && (node.wildcard.handlers.has(method) || node.wildcard.handlers.has("ALL"))) {
            nodes.push(node.wildcard);
            return { nodes, params: { ...params, wildcard: path }, matched: true };
        }

        if (nodes.length > state.len) {
            state.nodes = nodes.slice();
            state.params = { ...params };
            state.len = nodes.length;
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

    /**
     *
     * @param {*} obj
     * @returns
     */
    decodeParams(obj) {
        const params = Object.create(null);
        for (const key in obj) {
            params[key] = decodeParam(obj[key]);
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
