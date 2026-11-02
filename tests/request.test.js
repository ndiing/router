const { parseUrl, parseQueryString, Request } = require("../src/request");

describe("parseQueryString", () => {
    test("kosong", () => {
        expect(parseQueryString("")).toEqual({});
    });
    test("single", () => {
        expect(parseQueryString("a=1&b=2")).toEqual({ a: "1", b: "2" });
    });
    test("duplikat -> array", () => {
        expect(parseQueryString("a=1&a=2&a=3")).toEqual({ a: ["1", "2", "3"] });
    });
});

describe("parseUrl", () => {
    test("path only", () => {
        expect(parseUrl("/a/b")).toEqual({ path: "/a/b", queryString: "", hash: "" });
    });
    test("query", () => {
        expect(parseUrl("/a?x=1")).toEqual({ path: "/a", queryString: "x=1", hash: "" });
    });
    test("hash", () => {
        expect(parseUrl("/a#h")).toEqual({ path: "/a", queryString: "", hash: "h" });
    });
    test("query + hash", () => {
        expect(parseUrl("/a?x=1#h")).toEqual({ path: "/a", queryString: "x=1", hash: "h" });
    });
});

describe("Request getters", () => {
    test("path, query, controller di-cache", () => {
        const req = Object.create(Request.prototype);
        req.url = "/a?x=1&x=2";
        expect(req.path).toBe("/a");
        expect(req.query).toEqual({ x: ["1", "2"] });
        const c1 = req.controller;
        const c2 = req.controller;
        expect(c1).toBe(c2);
    });
});
