const { Pattern } = require("./pattern.js");

class Node {
    constructor(segment = "") {
        this.segment = segment;
        this.hasRegExp = segment.startsWith(":") || segment.indexOf("*") !== -1;
        this.hasRegExpChildren = false;
        this.pattern = this.hasRegExp && new Pattern(segment);
        /**@type {Map<string,Node>}*/
        this.children = new Map();
        this.handlers = new Map([
            ["ALL", []],
            ["GET", []],
            ["QUERY", []],
            ["HEAD", []],
            ["OPTIONS", []],
            ["TRACE", []],
            ["PUT", []],
            ["DELETE", []],
            ["POST", []],
            ["PATCH", []],
            ["CONNECT", []],
        ]);
        // debug
        Object.defineProperty(this, "handlers", { configurable: true, enumerable: false, writable: true });
    }

    add(segment) {
        if (!this.children.has(segment)) {
            const node = new Node(segment);
            if (node.hasRegExp) this.hasRegExpChildren = true; // node.hasRegExp;
            this.children.set(segment, node);
        }
        return this.children.get(segment);
    }

    /**
     * @param {Node} node
     */
    merge(node, offset) {
        for (const [method, handlers] of node.handlers) {
            for (const handler of handlers) {
                handler.seq += offset;
                this.handlers.get(method).push(handler);
            }
        }

        for (const [segment, child] of node.children) {
            if (child.hasRegExp) this.hasRegExpChildren = true; // child.hasRegExp;
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
