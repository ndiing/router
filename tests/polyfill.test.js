const { Router } = require("../src");

describe("coverage penutup", () => {
    test("getOrInsertComputed throw non-function", () => {
        const map = new Map();
        expect(() => map.getOrInsertComputed("a", 1)).toThrow("The callback argument must be a function");
    });

    test("walk split di ujung path (rest kosong)", () => {
        const r = new Router();
        r.get("/abc", () => {});
        r.get("/ab", () => {});
        expect(Object.keys(r.find("GET", "/ab").handlers).length).toBe(1);
        expect(Object.keys(r.find("GET", "/abc").handlers).length).toBe(1);
    });

    test("find root tidak match -> tidak fallback", () => {
        const r = new Router();
        r.get("/x", () => {});
        const res = r.find("GET", "/");
        expect(Object.keys(res.handlers).length).toBe(0);
    });
});
