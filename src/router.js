const { Node } = require("./node");

/**
 *
 * @param {String} raw
 * @returns {String}
 */
function decodeParam(raw) {
    try {
        return decodeURIComponent(raw);
    } catch (error) {
        return raw;
    }
}

exports.decodeParam = decodeParam;

/**
 * @typedef Options
 * @property {Number} [requestTimeout=0]
 */
class Router {
    /**
     *
     * @param {Options} options
     */
    constructor(options = {}) {
        this.requestTimeout = options.requestTimeout ?? 0;

        this.root = new Node();
        this.seq = 0;
    }

    /**
     *
     * @param {String} a
     * @param {String} b
     * @returns {Number}
     */
    lcp(a, b) {
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        return i;
    }

    /**
     *
     * @param {String} path
     * @param {Node} node
     * @returns {Node}
     */
    walk(path, node) {
        let i = 0;
        while (i < path.length) {
            const child = node.children.get(path[i]);
            if (!child) {
                return node.add(path.slice(i));
            }

            const lcp = this.lcp(child.prefix, path.slice(i));
            if (lcp === child.prefix.length) {
                i += lcp;
                node = child;
                continue;
            }

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
     *
     * @param {String} method
     * @param {String|Callback|Router} path
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

    /* HTTP request methods */
    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    use(path, ...handlers) {
        this.add("ALL", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    get(path, ...handlers) {
        this.add("GET", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    query(path, ...handlers) {
        this.add("QUERY", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    head(path, ...handlers) {
        this.add("HEAD", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    options(path, ...handlers) {
        this.add("OPTIONS", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    trace(path, ...handlers) {
        this.add("TRACE", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    put(path, ...handlers) {
        this.add("PUT", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    delete(path, ...handlers) {
        this.add("DELETE", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    post(path, ...handlers) {
        this.add("POST", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    patch(path, ...handlers) {
        this.add("PATCH", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    connect(path, ...handlers) {
        this.add("CONNECT", path, ...handlers);
        return this;
    }

    /**
     *
     * @param {String} method
     * @param {String} path
     * @param {Node} node
     * @param {Array} nodes
     * @param {Object} params
     * @param {{nodes: [];params: {};}} state
     * @returns {{nodes: [];params: {};matched: boolean;}}
     */
    search(method, path, node = this.root, nodes = [], params = {}, state = { nodes: [], params: {} }) {
        nodes.push(node);

        if (path.length === 0) {
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

        const child = node.children.get(path[0]);
        if (child) {
            const lcp = this.lcp(child.prefix, path);
            if (lcp === child.prefix.length) {
                const res = this.search(method, path.slice(lcp), child, nodes, params, state);
                if (res.matched) return res;
            }
        }

        if (node.params.size) {
            const slashIndex = path.indexOf("/");
            const value = slashIndex === -1 ? path : path.slice(0, slashIndex);
            if (value.length) {
                const rest = slashIndex === -1 ? "" : path.slice(slashIndex);
                for (const child of node.params.values()) {
                    const next = { ...params, [child.name]: decodeParam(value) };
                    const res = this.search(method, rest, child, nodes, next, state);
                    if (res.matched) return res;
                }
            }
        }

        if (node.wildcard && (node.wildcard.handlers.has(method) || node.wildcard.handlers.has("ALL"))) {
            nodes.push(node.wildcard);
            return { nodes, params: { ...params, wildcard: decodeParam(path) }, matched: true };
        }

        if (nodes.length > state.nodes.length) {
            state.nodes = nodes.slice();
            state.params = { ...params };
        }

        nodes.pop();

        return { nodes: state.nodes, params: state.params, matched: false };
    }

    /**
     *
     * @param {Node} node
     * @param {String} method
     * @param {Object} target
     */
    collect(node, method, target) {
        if (node.handlers.has(method)) {
            for (const entry of node.handlers.get(method)) {
                target[entry.seq] = entry.handler;
            }
        }
    }

    /**
     *
     * @param {String} method
     * @param {String} path
     * @returns {{params: {};handlers: {};errorHandlers: {};}}
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
            this.collect(res.nodes.at(-1), method, handlers);
        }

        for (const node of res.nodes) {
            this.collect(node, "ALL", handlers);
            this.collect(node, "CATCH", errorHandlers);
        }

        return { params: res.params, handlers: handlers, errorHandlers: errorHandlers };
    }
}

exports.Router = Router;
