const { Pattern } = require("./pattern.js");


class Node {
    constructor(segment = "") {
        this.hasRegExpChildren = false;
        this.pattern = /[:*]/.test(segment) && new Pattern(segment);
        /**@type {Map<string,Node>}*/
        this.children = new Map();
        this.handlers = new Map();
    }

    add(segment) {
        const node = new Node(segment);
        if (node.pattern) this.hasRegExpChildren = true; // node.hasRegExp;
        return this.children.getOrInsert(segment,node);
    }

    /**
     * @param {Node} node
     */
    merge(node, offset) {
        for (const [method, handlers] of node.handlers) {
            for (const handler of handlers) {
                handler.seq += offset;
                this.handlers.getOrInsert(method,[]).push(handler);
            }
        }

        for (const [segment, child] of node.children) {
            if (child.pattern) this.hasRegExpChildren = true; // child.hasRegExp;
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
