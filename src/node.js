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
        return this.children.getOrInsertComputed(segment, () => {
            const node = new Node(segment);
            if (node.pattern) this.hasRegExpChildren = true;
            return node;
        });
    }

    merge(node, offset) {
        for (const [method, entries] of node.handlers) {
            const target = this.handlers.getOrInsert(method, []);
            for (const entry of entries) {
                target.push({ ...entry, seq: entry.seq + offset });
            }
        }
        for (const [segment, child] of node.children) {
            const target = this.children.getOrInsertComputed(segment, () => new Node(segment));
            if (target.pattern) this.hasRegExpChildren = true;
            target.merge(child, offset);
        }
    }

    getMaxSeq() {
        let max = -1;
        for (const [, handlers] of this.handlers) {
            for (const entry of handlers) {
                max = Math.max(max, entry.seq);
            }
        }
        for (const [, child] of this.children) {
            max = Math.max(max, child.getMaxSeq());
        }
        return max;
    }
}

exports.Node = Node;
