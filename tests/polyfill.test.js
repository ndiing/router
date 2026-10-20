// tests/polyfill.test.js

describe("polyfill", () => {
    describe("getOrInsert", () => {
        let original;

        beforeEach(() => {
            original = Map.prototype.getOrInsert;
            delete Map.prototype.getOrInsert;
            // re-require polyfill
            delete require.cache[require.resolve("../src/polyfill")];
            require("../src/polyfill");
        });

        afterEach(() => {
            Map.prototype.getOrInsert = original;
        });

        test("inserts if missing", () => {
            const map = new Map();
            expect(map.getOrInsert("a", 1)).toBe(1);
            expect(map.get("a")).toBe(1);
        });

        test("returns existing if present", () => {
            const map = new Map();
            map.set("a", 1);
            expect(map.getOrInsert("a", 2)).toBe(1);
            expect(map.get("a")).toBe(1);
        });
    });

    describe("getOrInsertComputed", () => {
        let original;

        beforeEach(() => {
            original = Map.prototype.getOrInsertComputed;
            delete Map.prototype.getOrInsertComputed;
            delete require.cache[require.resolve("../src/polyfill")];
            require("../src/polyfill");
        });

        afterEach(() => {
            Map.prototype.getOrInsertComputed = original;
        });

        test("computes if missing", () => {
            const map = new Map();
            expect(map.getOrInsertComputed("a", (k) => k + "!")).toBe("a!");
            expect(map.get("a")).toBe("a!");
        });

        test("returns existing if present", () => {
            const map = new Map();
            map.set("a", 1);
            expect(map.getOrInsertComputed("a", () => 2)).toBe(1);
        });

        test("throws if callback not function", () => {
            const map = new Map();
            expect(() => map.getOrInsertComputed("a", "not function")).toThrow('The callback argument must be a function');
        });
    });
});