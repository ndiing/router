require("../src/polyfill");
const { Node } = require("../src/node");

describe("Node", () => {
    test("constructor default", () => {
        const n = new Node();
        expect(n.label).toBe("");
        expect(n.name).toBe(undefined);
        expect(n.children instanceof Map).toBe(true);
        expect(n.params instanceof Map).toBe(true);
        expect(n.handlers instanceof Object).toBe(true);
        expect(n.wildcard).toBe(null);
    });
    test("constructor param label", () => {
        expect(new Node(":id").name).toBe("id");
    });
    test("add static child reuses by first char", () => {
        const n = new Node();
        expect(n.add("abc")).toBe(n.add("abc"));
    });
    test("add wildcard", () => {
        const n = new Node();
        const w1 = n.add("*");
        expect(w1).toBe(n.add("*"));
        expect(w1.label).toBe("*");
    });
    test("add param", () => {
        const n = new Node();
        const p1 = n.add(":id");
        expect(p1).toBe(n.add(":id"));
        expect(p1.name).toBe("id");
    });
    test("maxSeq empty = -1", () => {
        expect(new Node().maxSeq()).toBe(-1);
    });
    test("maxSeq with handlers", () => {
        const n = new Node();
        n.handlers["GET"] = [{ seq: 5 }, { seq: 3 }];
        expect(n.maxSeq()).toBe(5);
    });
    test("merge handlers with offset", () => {
        const src = new Node();
        src.handlers["GET"] = [{ handler: 1, seq: 0 }];
        const dst = new Node();
        dst.handlers["GET"] = [{ handler: 0, seq: 5 }];
        dst.merge(src, 10);
        const entries = dst.handlers["GET"];
        expect(entries.length).toBe(2);
        expect(entries[1].seq).toBe(10);
    });
});

test("merge wildcard, params, children", () => {
    const src = new Node();
    src.add("*").handlers["GET"] = [{ handler: 1, seq: 0 }];
    src.add(":id").handlers["GET"] = [{ handler: 2, seq: 1 }];
    src.add("x").handlers["GET"] = [{ handler: 3, seq: 2 }];
    const dst = new Node();
    dst.merge(src, 100);
    // expect(dst.wildcard).toBeTruthy();
    expect(dst.wildcard.handlers["GET"][0].seq).toBe(100);
    expect(dst.maxSeq() >= 102).toBe(true);
});
