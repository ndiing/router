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
     * @param {String} label
     */
    constructor(label = "") {
        /**@type {String}*/
        this.label = label;
        if (label.startsWith(":")) {
            /**@type {String}*/
            this.name = label.slice(1);
        }
        /**@type {Map<string, Node>}*/
        this.children = new Map();
        /**@type {Map<string, Node>}*/
        this.params = new Map();
        /**@type {Node}*/
        this.wildcard = null;
        /**@type {Object<string, {handler:Callback;seq:Number;}[]>}*/
        this.handlers = {};
    }

    /**
     * @param {String} label
     * @returns {Node}
     */
    add(label) {
        if (label === "*") {
            if (!this.wildcard) this.wildcard = new Node("*");
            return this.wildcard;
        }
        if (label.startsWith(":")) return this.params.getOrInsertComputed(label, () => new Node(label));
        return this.children.getOrInsertComputed(label[0], () => new Node(label));
    }

    /**
     * @param {Node} node
     * @param {Number} offset
     */
    merge(node, offset = 0) {
        for (const [method, entries] of Object.entries(node.handlers)) {
            for (const entry of entries) {
                (this.handlers[method] ??= []).push({ ...entry, seq: entry.seq + offset });
            }
        }
        if (node.wildcard) this.add("*").merge(node.wildcard, offset);
        for (const [, child] of node.params) this.add(child.label).merge(child, offset);
        for (const [, child] of node.children) this.add(child.label).merge(child, offset);
    }

    /**
     * @returns {Number}
     */
    maxSeq() {
        let max = -1;
        for (const [, entries] of Object.entries(this.handlers)) {
            for (const entry of entries) max = Math.max(max, entry.seq);
        }
        if (this.wildcard) max = Math.max(max, this.wildcard.maxSeq());
        for (const [, child] of this.params) max = Math.max(max, child.maxSeq());
        for (const [, child] of this.children) max = Math.max(max, child.maxSeq());
        return max;
    }
}

exports.Node = Node;
