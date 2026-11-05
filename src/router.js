const { Node } = require("./node");
const { decodeParam, decodeParams } = require("./util");

/**
 * @typedef Options
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
     * @param {String} path
     * @param {Node} node
     * @returns {Node}
     */
    add(path, node) {
        let i = 0;
        while (i < path.length) {
            const child = node.children.get(path[i]);
            if (!child) {
                return node.add(path.slice(i));
            }
            const lcp = this.lcp(child.label, path.slice(i));
            if (lcp === child.label.length) {
                i += lcp;
                node = child;
                continue;
            }
            const split = new Node(child.label.slice(0, lcp));
            child.label = child.label.slice(lcp);
            split.children.set(child.label[0], child);
            node.children.set(split.label[0], split);
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
     * @param {String|Callback|Router} path
     * @param  {Callback[]} handlers
     */
    set(method, path, ...handlers) {
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
                    node = this.add(path.slice(i, j), node);
                    i = j;
                }
            }
        }
        for (const handler of handlers) {
            if (handler.root) {
                node.merge(handler.root, this.seq);
                this.seq += handler.root.maxSeq() + 1;
            } else {
                const m = handler.length === 3 ? "CATCH" : method;
                (node.handlers[m] ??= []).push({ handler, seq: this.seq++ });
            }
        }
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    use(path, ...handlers) {
        this.set("ALL", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    get(path, ...handlers) {
        this.set("GET", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    query(path, ...handlers) {
        this.set("QUERY", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    head(path, ...handlers) {
        this.set("HEAD", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    options(path, ...handlers) {
        this.set("OPTIONS", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    trace(path, ...handlers) {
        this.set("TRACE", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    put(path, ...handlers) {
        this.set("PUT", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    delete(path, ...handlers) {
        this.set("DELETE", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    post(path, ...handlers) {
        this.set("POST", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    patch(path, ...handlers) {
        this.set("PATCH", path, ...handlers);
        return this;
    }

    /**
     * @param {String} [path]
     * @param  {Callback[]|Router} handlers
     * @returns {Router}
     */
    connect(path, ...handlers) {
        this.set("CONNECT", path, ...handlers);
        return this;
    }

    /**
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
            if (node.handlers[method] || node.handlers["ALL"]) {
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
            const lcp = this.lcp(child.label, path);
            if (lcp === child.label.length) {
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
                    const next = { ...params, [child.name]: value };
                    const res = this.search(method, rest, child, nodes, next, state);
                    if (res.matched) return res;
                }
            }
        }
        if (node.wildcard && (node.wildcard.handlers[method] || node.wildcard.handlers["ALL"])) {
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
     * @param {Object} target
     */
    collect(node, method, target) {
        if (node.handlers[method]) {
            for (const entry of node.handlers[method]) {
                target[entry.seq] = entry.handler;
            }
        }
    }

    /**
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
        return {
            params: decodeParams(res.params),
            handlers: handlers,
            errorHandlers: errorHandlers,
        };
    }
}

exports.Router = Router;
