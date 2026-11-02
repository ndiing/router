/**
 * @callback Handler
 * @param {Request} req
 * @param {Response} [res]
 */
/**
 * @callback ErrorHandler
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 */
/**
 * @typedef {Handler|ErrorHandler} Callback
 */
class Node {
    /**
     *
     * @param {String} prefix
     */
    constructor(prefix = "") {
        /**
         * @type {String}
         */
        this.prefix = prefix;
        if (prefix.startsWith(":")) {
            /**
             * @type {String}
             */
            this.name = prefix.slice(1);
        }
        /**
         * @type {Map<string, Node>}
         */
        this.children = new Map();
        /**
         * @type {Map<string, Node>}
         */
        this.params = new Map();
        /**
         * @type {Node}
         */
        this.wildcard = null;
        /**
         * @type {Map<string, Object<string, Callback[]>>}
         */
        this.handlers = new Map();
    }

    /**
     *
     * @param {String} prefix
     * @returns {Node}
     */
    add(prefix) {
        if (prefix === "*") {
            if (!this.wildcard) {
                this.wildcard = new Node("*");
            }

            return this.wildcard;
        }

        if (prefix.startsWith(":")) {
            return this.params.getOrInsertComputed(prefix, () => new Node(prefix));
        }

        return this.children.getOrInsertComputed(prefix[0], () => new Node(prefix));
    }

    /**
     *
     * @param {Node} node
     * @param {Number} offset
     */
    merge(node, offset = 0) {
        for (const [method, entries] of node.handlers) {
            for (const entry of entries) {
                this.handlers.getOrInsert(method, []).push({ ...entry, seq: entry.seq + offset });
            }
        }

        if (node.wildcard) {
            this.add("*").merge(node.wildcard, offset);
        }

        for (const [, child] of node.params) {
            this.add(child.prefix).merge(child, offset);
        }

        for (const [, child] of node.children) {
            this.add(child.prefix).merge(child, offset);
        }
    }

    /**
     *
     * @returns {Number}
     */
    getMaxSeq() {
        let max = -1;

        for (const [, entries] of this.handlers) {
            for (const entry of entries) max = Math.max(max, entry.seq);
        }

        if (this.wildcard) {
            max = Math.max(max, this.wildcard.getMaxSeq());
        }

        for (const [, child] of this.params) {
            max = Math.max(max, child.getMaxSeq());
        }

        for (const [, child] of this.children) {
            max = Math.max(max, child.getMaxSeq());
        }

        return max;
    }
}

exports.Node = Node;
