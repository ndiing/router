const { Node } = require("../src/node");

describe("Node", () => {
    describe("add", () => {
        test("add static segment", () => {
            const node = new Node();
            node.add("api");
            expect(node.children.has("api")).toBe(true);
        });

        test("add param segment", () => {
            const node = new Node();
            node.add(":id");
            expect(node.params.has(":id")).toBe(true);
        });

        test("add wildcard segment", () => {
            const node = new Node();
            node.add("*");
            expect(node.wildcard !== null).toBe(true);
        });

        test("add returns same node for same static segment", () => {
            const node = new Node();
            const a = node.add("api");
            const b = node.add("api");
            expect(a).toBe(b);
        });

        test("add returns same node for same param segment", () => {
            const node = new Node();
            const a = node.add(":id");
            const b = node.add(":id");
            expect(a).toBe(b);
        });

        test("add returns same node for wildcard segment", () => {
            const node = new Node();
            const a = node.add("*");
            const b = node.add("*");
            expect(a).toBe(b);
        });

        test("add different static segments returns different nodes", () => {
            const node = new Node();
            const a = node.add("api");
            const b = node.add("users");
            expect(a !== b).toBe(true);
        });

        test("add different param segments returns different nodes", () => {
            const node = new Node();
            const a = node.add(":id");
            const b = node.add(":userid");
            expect(a !== b).toBe(true);
        });

        test("add param and static are separate", () => {
            const node = new Node();
            const a = node.add(":id");
            const b = node.add("api");
            expect(a !== b).toBe(true);
            expect(node.params.has(":id")).toBe(true);
            expect(node.children.has("api")).toBe(true);
        });

        test("add chained returns deepest node", () => {
            const node = new Node();
            const users = node.add("users");
            const id = users.add(":id");
            expect(node.children.get("users")).toBe(users);
            expect(users.params.get(":id")).toBe(id);
        });
    });

    describe("merge", () => {
        test("merge static children", () => {
            const src = new Node();
            src.add("users").add(":id");

            const dst = new Node();
            dst.merge(src, 0);

            expect(dst.children.has("users")).toBe(true);
            const users = dst.children.get("users");
            expect(users.params.has(":id")).toBe(true);
        });

        test("merge param children", () => {
            const src = new Node();
            src.add(":id").add("details");

            const dst = new Node();
            dst.merge(src, 0);

            expect(dst.params.has(":id")).toBe(true);
            const id = dst.params.get(":id");
            expect(id.children.has("details")).toBe(true);
        });

        test("merge wildcard", () => {
            const src = new Node();
            src.add("*");

            const dst = new Node();
            dst.merge(src, 0);

            expect(dst.wildcard !== null).toBe(true);
        });

        test("merge into existing wildcard does not replace", () => {
            const src = new Node();
            src.add("*");
            src.wildcard.handlers.set("GET", [{ handler: () => {}, seq: 0 }]);

            const dst = new Node();
            dst.add("*");
            const existingWildcard = dst.wildcard;
            dst.merge(src, 0);

            expect(dst.wildcard).toBe(existingWildcard);
            expect(dst.wildcard.handlers.has("GET")).toBe(true);
        });

        test("merge handlers with offset", () => {
            const src = new Node();
            src.handlers.set("GET", [{ handler: () => {}, seq: 0 }]);
            src.handlers.set("POST", [{ handler: () => {}, seq: 1 }]);

            const dst = new Node();
            dst.merge(src, 10);

            expect(dst.handlers.get("GET")[0].seq).toBe(10);
            expect(dst.handlers.get("POST")[0].seq).toBe(11);
        });

        test("merge keeps existing handlers", () => {
            const src = new Node();
            src.handlers.set("GET", [{ handler: () => {}, seq: 0 }]);

            const dst = new Node();
            dst.handlers.set("GET", [{ handler: () => {}, seq: 5 }]);
            dst.merge(src, 10);

            expect(dst.handlers.get("GET").length).toBe(2);
            expect(dst.handlers.get("GET")[0].seq).toBe(5);
            expect(dst.handlers.get("GET")[1].seq).toBe(10);
        });

        test("merge recursive handlers", () => {
            const src = new Node();
            src.add("users").handlers.set("GET", [{ handler: () => {}, seq: 3 }]);

            const dst = new Node();
            dst.merge(src, 100);

            const users = dst.children.get("users");
            expect(users.handlers.get("GET")[0].seq).toBe(103);
        });

        test("merge does not mutate source", () => {
            const src = new Node();
            src.add("users").handlers.set("GET", [{ handler: () => {}, seq: 3 }]);

            const dst = new Node();
            dst.merge(src, 100);

            expect(src.children.get("users").handlers.get("GET")[0].seq).toBe(3);
        });
    });

    describe("getMaxSeq", () => {
        test("empty node returns -1", () => {
            expect(new Node().getMaxSeq()).toBe(-1);
        });

        test("with handlers", () => {
            const node = new Node();
            node.handlers.set("GET", [{ handler: () => {}, seq: 5 }]);
            expect(node.getMaxSeq()).toBe(5);
        });

        test("multiple handlers returns max", () => {
            const node = new Node();
            node.handlers.set("GET", [{ handler: () => {}, seq: 3 }]);
            node.handlers.set("POST", [{ handler: () => {}, seq: 7 }]);
            expect(node.getMaxSeq()).toBe(7);
        });

        test("recursive through children", () => {
            const node = new Node();
            const child = node.add("api");
            child.handlers.set("GET", [{ handler: () => {}, seq: 7 }]);
            expect(node.getMaxSeq()).toBe(7);
        });

        test("recursive through params", () => {
            const node = new Node();
            const child = node.add(":id");
            child.handlers.set("GET", [{ handler: () => {}, seq: 9 }]);
            expect(node.getMaxSeq()).toBe(9);
        });

        test("recursive through wildcard", () => {
            const node = new Node();
            const child = node.add("*");
            child.handlers.set("GET", [{ handler: () => {}, seq: 11 }]);
            expect(node.getMaxSeq()).toBe(11);
        });

        test("takes max across all branches", () => {
            const node = new Node();
            node.add("api").handlers.set("GET", [{ handler: () => {}, seq: 2 }]);
            node.add(":id").handlers.set("GET", [{ handler: () => {}, seq: 5 }]);
            node.add("*").handlers.set("GET", [{ handler: () => {}, seq: 3 }]);
            expect(node.getMaxSeq()).toBe(5);
        });
    });
});
