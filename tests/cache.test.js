const { Cache } = require("../src/cache");

describe("Cache", () => {
    describe("constructor", () => {
        test("default size 0", () => {
            const c = new Cache();
            expect(c.size).toBe(0);
        });

        test("custom size", () => {
            const c = new Cache(100);
            expect(c.size).toBe(100);
        });
    });

    describe("get", () => {
        test("returns undefined for missing key", () => {
            const c = new Cache(10);
            expect(c.get("nope")).toBe(undefined);
        });

        test("returns value for existing key", () => {
            const c = new Cache(10);
            c.set("a", 1);
            expect(c.get("a")).toBe(1);
        });

        test("returns falsy values correctly", () => {
            const c = new Cache(10);
            c.set("zero", 0);
            c.set("empty", "");
            c.set("false", false);
            c.set("null", null);
            expect(c.get("zero")).toBe(0);
            expect(c.get("empty")).toBe("");
            expect(c.get("false")).toBe(false);
            expect(c.get("null")).toBe(null);
        });
    });

    describe("set", () => {
        test("stores value", () => {
            const c = new Cache(10);
            c.set("a", 1);
            expect(c.get("a")).toBe(1);
        });

        test("updates existing key", () => {
            const c = new Cache(10);
            c.set("a", 1);
            c.set("a", 2);
            expect(c.get("a")).toBe(2);
        });

        test("size 0 disables cache", () => {
            const c = new Cache(0);
            c.set("a", 1);
            expect(c.get("a")).toBe(undefined);
        });

        test("negative size disables cache", () => {
            const c = new Cache(-1);
            c.set("a", 1);
            expect(c.get("a")).toBe(undefined);
        });
    });

    describe("LRU eviction", () => {
        test("evicts oldest when full", () => {
            const c = new Cache(2);
            c.set("a", 1);
            c.set("b", 2);
            c.set("c", 3); // evict "a"
            expect(c.get("a")).toBe(undefined);
            expect(c.get("b")).toBe(2);
            expect(c.get("c")).toBe(3);
        });

        test("get touches LRU order", () => {
            const c = new Cache(2);
            c.set("a", 1);
            c.set("b", 2);
            c.get("a"); // touch "a" -> "b" jadi oldest
            c.set("c", 3); // evict "b"
            expect(c.get("a")).toBe(1);
            expect(c.get("b")).toBe(undefined);
            expect(c.get("c")).toBe(3);
        });

        test("set existing key does not evict", () => {
            const c = new Cache(2);
            c.set("a", 1);
            c.set("b", 2);
            c.set("a", 10); // update, tidak evict
            expect(c.get("a")).toBe(10);
            expect(c.get("b")).toBe(2);
        });

        test("evicts multiple times", () => {
            const c = new Cache(2);
            c.set("a", 1);
            c.set("b", 2);
            c.set("c", 3); // evict a
            c.set("d", 4); // evict b
            expect(c.get("a")).toBe(undefined);
            expect(c.get("b")).toBe(undefined);
            expect(c.get("c")).toBe(3);
            expect(c.get("d")).toBe(4);
        });
    });

    describe("clear", () => {
        test("clears all entries", () => {
            const c = new Cache(10);
            c.set("a", 1);
            c.set("b", 2);
            c.clear();
            expect(c.get("a")).toBe(undefined);
            expect(c.get("b")).toBe(undefined);
        });
    });
});
