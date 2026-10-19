class Node {
    constructor(segment = "") {
        this.segment = segment;
        /**@type {Map<string, Node>}*/
        this.staticChildren = new Map();
        this.paramChild = null;
        this.paramName = null;
        this.wildcardChild = null;
        /**@type {Map<string, Function[]>}*/
        this.handlers = new Map();
    }
    /**
     * @param {String} segment
     * @returns {Node}
     */
    add(segment) {
        if (segment.startsWith(":")) {
            if (this.paramChild) return this.paramChild;
            this.paramChild = new Node(segment);
            this.paramChild.paramName = segment.slice(1);
            this.paramChild.type = "param";
            return this.paramChild;
        } else if (segment.startsWith("*")) {
            if (this.wildcardChild) return this.wildcardChild;
            this.wildcardChild = new Node(segment);
            this.wildcardChild.type = "wildcard";
            return this.wildcardChild;
        } else {
            return this.staticChildren.getOrInsertComputed(segment, (segment) => {
                const node = new Node(segment);
                node.type = "wildcard";
                return node;
            });
        }
    }
    /**
     * @param {Node} node
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

        if (node.paramChild) {
            this.add(node.paramChild.segment).merge(node.paramChild, offset);
        }
        if (node.wildcardChild) {
            this.add(node.wildcardChild.segment).merge(node.wildcardChild, offset);
        }
        for (const [segment, child] of node.staticChildren) {
            this.add(segment).merge(child, offset);
        }
    }

    getMaxSeq() {
        let max = -1;
        for (const [method, entries] of this.handlers) {
            for (const entry of entries) {
                max = Math.max(max, entry.seq);
            }
        }

        if (this.paramChild) {
            max = Math.max(max, this.paramChild.getMaxSeq());
        }
        if (this.wildcardChild) {
            max = Math.max(max, this.wildcardChild.getMaxSeq());
        }
        for (const [path, child] of this.staticChildren) {
            max = Math.max(max, child.getMaxSeq());
        }

        return max;
    }
}

exports.Node = Node;
