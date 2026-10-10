const { Pattern } = require("./pattern.js");

class Node {
    constructor(segment) {
        this.segment = segment;
        this.pattern = new Pattern(segment);
        /**@type {Map<string, Node>}*/
        this.children = new Map();
        /**@type {Map<string, Function[]>}*/
        this.handlers = new Map();
    }

    add(segment) {
        if (!this.children.has(segment)) {
            this.children.set(segment, new Node(segment));
        }
        return this.children.get(segment);
    }

    /**
     * @param {Node} node
     * @param {Number} offset
     */
    merge(node, offset) {
        for (const [method, handlers] of node.handlers) {
            for (const handler of handlers) {
                handler.seq += offset;
                this.handlers.getOrInsert(method, []).push(handler);
            }
        }

        for (const [segment, child] of node.children) {
            if (!this.children.has(segment)) {
                child.setSeqOffset(offset);
                this.children.set(segment, child);
            } else {
                this.children.get(segment).merge(child, offset);
            }
        }
    }

    setSeqOffset(offset) {
        for (const [, handlers] of this.handlers) {
            for (const handler of handlers) {
                handler.seq += offset;
            }
        }

        for (const [, child] of this.children) {
            child.setSeqOffset(offset);
        }
    }

    getMaxSeq() {
        let max = -1;

        for (const [, handlers] of this.handlers) {
            for (const handler of handlers) {
                max = Math.max(max, handler.seq);
            }
        }

        for (const [, child] of this.children) {
            max = Math.max(max, child.getMaxSeq());
        }

        return max;
    }
}
exports.Node = Node;
