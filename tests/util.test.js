const { decodeParam, parseQueryString, parseUrl } = require("../src/util");

describe("util", () => {
    describe("decodeParam", () => {
        test("decodes plain string", () => {
            expect(decodeParam("abc")).toBe("abc");
        });

        test("decodes percent-encoded", () => {
            expect(decodeParam("hello%20world")).toBe("hello world");
        });

        test("decodes unicode", () => {
            expect(decodeParam("%E4%BD%A0%E5%A5%BD")).toBe("你好");
        });

        test("decodes plus as literal plus (not space)", () => {
            // decodeParam TIDAK mengubah '+' jadi space (beda dengan decodeQuery)
            expect(decodeParam("a+b")).toBe("a+b");
        });

        test("returns raw on malformed percent", () => {
            expect(decodeParam("%")).toBe("%");
        });

        test("returns raw on incomplete percent", () => {
            expect(decodeParam("%2")).toBe("%2");
        });

        test("returns raw on invalid utf8 sequence", () => {
            // %FF bukan utf8 valid, decodeURIComponent throw
            expect(decodeParam("%FF")).toBe("%FF");
        });

        test("handles empty string", () => {
            expect(decodeParam("")).toBe("");
        });
    });

    describe("parseQueryString", () => {
        test("empty string returns empty object", () => {
            const result = parseQueryString("");
            expect(Object.keys(result).length).toBe(0);
            expect(Object.getPrototypeOf(result)).toBe(null);
        });

        test("single key-value", () => {
            const result = parseQueryString("user=name");
            expect(result.user).toBe("name");
        });

        test("multiple key-value", () => {
            const result = parseQueryString("user=name&pass=word");
            expect(result.user).toBe("name");
            expect(result.pass).toBe("word");
        });

        test("duplicate key becomes array", () => {
            const result = parseQueryString("age=1&age=2");
            expect(Array.isArray(result.age)).toBe(true);
            expect(result.age).toEqual(["1", "2"]);
        });

        test("three duplicate keys", () => {
            const result = parseQueryString("a=1&a=2&a=3");
            expect(result.a).toEqual(["1", "2", "3"]);
        });

        test("empty value", () => {
            const result = parseQueryString("a=&b=c");
            expect(result.a).toBe("");
            expect(result.b).toBe("c");
        });

        test("empty key", () => {
            const result = parseQueryString("=%");
            expect(result[""]).toBe("%");
        });

        test("empty key and empty value", () => {
            const result = parseQueryString("=");
            expect(result[""]).toBe("");
        });

        test("decodes percent-encoded", () => {
            const result = parseQueryString("search=search+query%20%28correct%29");
            expect(result.search).toBe("search query (correct)");
        });

        test("plus becomes space", () => {
            const result = parseQueryString("q=hello+world");
            expect(result.q).toBe("hello world");
        });

        test("encoded plus becomes literal plus", () => {
            // %2B -> '+', bukan space
            const result = parseQueryString("q=a%2Bb");
            expect(result.q).toBe("a+b");
        });

        test("malformed percent keeps raw", () => {
            const result = parseQueryString("a=%");
            expect(result.a).toBe("%");
        });

        test("null prototype prevents pollution", () => {
            const result = parseQueryString("__proto__=x&constructor=y");
            expect(Object.getPrototypeOf(result)).toBe(null);
            // key '__proto__' jadi own property, bukan prototype
            expect(Object.hasOwn(result, "__proto__")).toBe(true);
            expect(result["__proto__"]).toBe("x");
            expect(result.constructor).toBe("y");
        });

        test("trailing ampersand is ignored", () => {
            const result = parseQueryString("a=1&");
            expect(result.a).toBe("1");
        });

        test("key without = value", () => {
            const result = parseQueryString("foo");
            expect(Object.hasOwn(result, "foo")).toBe(true);
        });
    });

    describe("parseUrl", () => {
        test("plain path", () => {
            const result = parseUrl("/api/users");
            expect(result.path).toBe("/api/users");
            expect(result.queryString).toBe("");
        });

        test("root path", () => {
            const result = parseUrl("/");
            expect(result.path).toBe("/");
            expect(result.queryString).toBe("");
        });

        test("path with trailing slash preserved", () => {
            const result = parseUrl("/api/");
            expect(result.path).toBe("/api/");
        });

        test("path with query", () => {
            const result = parseUrl("/api?user=name&pass=word");
            expect(result.path).toBe("/api");
            expect(result.queryString).toBe("user=name&pass=word");
        });

        test("root with query", () => {
            const result = parseUrl("/?user=name");
            expect(result.path).toBe("/");
            expect(result.queryString).toBe("user=name");
        });

        test("path with hash only", () => {
            const result = parseUrl("/api#section");
            expect(result.path).toBe("/api");
            expect(result.queryString).toBe("");
        });

        test("root with hash only", () => {
            const result = parseUrl("/#section");
            expect(result.path).toBe("/");
            expect(result.queryString).toBe("");
        });

        test("path with query and hash", () => {
            const result = parseUrl("/api?user=name#section");
            expect(result.path).toBe("/api");
            expect(result.queryString).toBe("user=name");
        });

        test("hash is stripped from query", () => {
            const result = parseUrl("/api?a=b#c");
            expect(result.queryString).toBe("a=b");
        });

        test("query with encoded question mark not split", () => {
            const result = parseUrl("/api%3Ffoo");
            expect(result.path).toBe("/api%3Ffoo");
            expect(result.queryString).toBe("");
        });

        test("empty query", () => {
            const result = parseUrl("/api?");
            expect(result.path).toBe("/api");
            expect(result.queryString).toBe("");
        });

        test("multiple question marks - first wins", () => {
            const result = parseUrl("/api?a=b?c=d");
            expect(result.path).toBe("/api");
            expect(result.queryString).toBe("a=b?c=d");
        });
    });
});
