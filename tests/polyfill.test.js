require("../src/polyfill");

describe("Map.getOrInsert", () => {
    test("inserts when missing", () => {
        const m = new Map();
        const v = m.getOrInsert("a", 1);
        expect(v).toBe(1);
        expect(m.get("a")).toBe(1);
    });

    test("returns existing without overwriting", () => {
        const m = new Map([["a", 1]]);
        const v = m.getOrInsert("a", 2);
        expect(v).toBe(1);
    });
});

describe("Map.getOrInsertComputed", () => {
    test("computes value with key", () => {
        const m = new Map();
        const v = m.getOrInsertComputed("x", (k) => k + "!");
        expect(v).toBe("x!");
        expect(m.get("x")).toBe("x!");
    });

    test("does not recompute when present", () => {
        const m = new Map([["x", 1]]);
        let called = false;
        const v = m.getOrInsertComputed("x", () => {
            called = true;
            return 2;
        });
        expect(v).toBe(1);
        expect(called).toBe(false);
    });

    test("throws when callback not function", () => {
        const m = new Map();
        expect(() => m.getOrInsertComputed("k", 123)).toThrow("is not a function");
    });
});
