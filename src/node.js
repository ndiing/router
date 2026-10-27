class Node {
    /**
     * @param {String} prefix
     */
    constructor(prefix = "") {
        this.prefix = prefix;
        if (prefix.startsWith(":")) {
            /**@type {String}*/
            this.name = prefix.slice(1);
        }
        /**@type {Map<string,Node>}*/
        this.children = new Map();
        /**@type {Map<string,Node>}*/
        this.params = new Map();
        /**@type {Node}*/
        this.wildcard = null;
        /**@type {Map<string,Function[]>}*/
        this.handlers = new Map();
    }

    /**
     * @param {String} prefix
     * @returns {Node}
     */
    add(prefix) {
        if (prefix === "*") {
            if (!this.wildcard) this.wildcard = new Node("*");
            return this.wildcard;
        }
        if (prefix.startsWith(":")) {
            return this.params.getOrInsertComputed(prefix, (prefix) => new Node(prefix));
        }
        return this.children.getOrInsertComputed(prefix, (prefix) => new Node(prefix));
    }

    /**
     * @param {String} prefix
     */
    remove(prefix) {
        this.children.delete(prefix);
    }

    /**
     * @param {Node} node
     * @param {Number} offset
     */
    merge(node, offset = 0) {
        for (const [method, entries] of node.handlers) {
            for (const entry of entries) {
                this.handlers.getOrInsert(method, []).push({
                    ...entry,
                    seq: entry.seq + offset,
                });
            }
        }
        if (node.wildcard) {
            this.add("*").merge(node.wildcard, offset);
        }
        for (const [prefix, child] of node.params) {
            this.add(prefix).merge(child, offset);
        }
        for (const [prefix, child] of node.children) {
            this.add(prefix).merge(child, offset);
        }
    }

    /**
     * @returns {Number}
     */
    getMaxSeq() {
        let max = -1;
        for (const [, entries] of this.handlers) {
            for (const entry of entries) {
                max = Math.max(max, entry.seq);
            }
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
