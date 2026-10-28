const { decodeParam, parseQueryString, parseUrl } = require("../src/util");

describe("util", () => {
    describe("decodeParam", () => {
        test("decodes valid URI", () => {
            expect(decodeParam("hello%20world")).toBe("hello world");
        });

        test("returns raw on invalid", () => {
            expect(decodeParam("%E0%A4%A")).toBe("%E0%A4%A");
        });

        test("handles plain string", () => {
            expect(decodeParam("abc")).toBe("abc");
        });
    });

    describe("parseQueryString", () => {
        test("empty string returns empty object", () => {
            expect(parseQueryString("")).toEqual({});
        });

        test("single key", () => {
            expect(parseQueryString("a=1")).toEqual({ a: "1" });
        });

        test("multiple keys", () => {
            expect(parseQueryString("a=1&b=2")).toEqual({ a: "1", b: "2" });
        });

        test("repeated key becomes array", () => {
            expect(parseQueryString("a=1&a=2")).toEqual({ a: ["1", "2"] });
        });

        test("repeated key three times", () => {
            expect(parseQueryString("a=1&a=2&a=3")).toEqual({
                a: ["1", "2", "3"],
            });
        });

        test("URL-encoded value decoded", () => {
            expect(parseQueryString("q=hello%20world")).toEqual({
                q: "hello world",
            });
        });
    });

    describe("parseUrl", () => {
        test("plain path", () => {
            expect(parseUrl("/a/b")).toEqual({
                path: "/a/b",
                queryString: "",
                hash: "",
            });
        });

        test("path with query", () => {
            const r = parseUrl("/a/b?x=1");
            expect(r.path).toBe("/a/b");
            expect(r.queryString).toBe("x=1");
        });

        test("path with hash", () => {
            const r = parseUrl("/a/b#section");
            expect(r.path).toBe("/a/b");
            expect(r.hash).toBe("section");
        });

        test("path with query and hash", () => {
            const r = parseUrl("/a/b?x=1#section");
            expect(r.path).toBe("/a/b");
            expect(r.queryString).toBe("x=1");
            expect(r.hash).toBe("section");
        });
    });
});
