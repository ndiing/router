class Node {
    /**
     * @param {String} segment
     */
    constructor(segment = "") {
        this.segment = segment;
        if (segment.startsWith(":")) {
            /**@type {String}*/
            this.name = segment.slice(1);
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
     * @param {String} segment
     * @returns {Node}
     */
    add(segment) {
        if (segment === "*") {
            if (!this.wildcard) this.wildcard = new Node("*");
            return this.wildcard;
        }
        if (segment.startsWith(":")) {
            return this.params.getOrInsertComputed(segment, (segment) => {
                return new Node(segment);
            });
        }
        return this.children.getOrInsertComputed(segment, (segment) => {
            return new Node(segment);
        });
    }

    /**
     * @param {Node} node
     * @param {Number} offset
     */
    merge(node, offset) {
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
        for (const [segment, child] of node.params) {
            this.add(segment).merge(child, offset);
        }
        for (const [segment, child] of node.children) {
            this.add(segment).merge(child, offset);
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
