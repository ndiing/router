const { parseUrl, parseQueryString } = require("../src/util.js");

// ============================================================
// parseUrl
// ============================================================

const toObjectLike = (object) => JSON.parse(JSON.stringify(object));

describe("parseUrl()", () => {
    test("path tanpa query", () => {
        expect(toObjectLike(parseUrl("/"))).toEqual({ path: "/", queryString: "" });
        expect(toObjectLike(parseUrl("/blogs"))).toEqual({ path: "/blogs", queryString: "" });
        expect(toObjectLike(parseUrl("/blogs/123"))).toEqual({ path: "/blogs/123", queryString: "" });
    });

    test("path dengan query", () => {
        expect(toObjectLike(parseUrl("/blogs?user=name"))).toEqual({
            path: "/blogs",
            queryString: "user=name",
        });
        expect(toObjectLike(parseUrl("/blogs?user=name&pass=word"))).toEqual({
            path: "/blogs",
            queryString: "user=name&pass=word",
        });
    });

    test("path dengan fragment", () => {
        expect(toObjectLike(parseUrl("/blogs#hash"))).toEqual({ path: "/blogs", queryString: "" });
        expect(toObjectLike(parseUrl("/#hash"))).toEqual({ path: "/", queryString: "" });
    });

    test("path dengan query + fragment", () => {
        expect(toObjectLike(parseUrl("/blogs?user=name#hash"))).toEqual({
            path: "/blogs",
            queryString: "user=name",
        });
    });

    test("query kosong", () => {
        expect(toObjectLike(parseUrl("/?"))).toEqual({ path: "/", queryString: "" });
        expect(toObjectLike(parseUrl("/?#"))).toEqual({ path: "/", queryString: "" });
    });

    test("fragment doang", () => {
        expect(toObjectLike(parseUrl("#hash"))).toEqual({ path: "/", queryString: "" });
    });

    test("string kosong", () => {
        expect(toObjectLike(parseUrl(""))).toEqual({ path: "/", queryString: "" });
    });

    test("query dengan karakter spesial", () => {
        expect(toObjectLike(parseUrl("/search?q=hello%20world"))).toEqual({
            path: "/search",
            queryString: "q=hello%20world",
        });
    });
});

// ============================================================
// parseQueryString
// ============================================================

describe("parseQueryString()", () => {
    test("string kosong", () => {
        expect(toObjectLike(parseQueryString(""))).toEqual({});
    });

    test("single key-value", () => {
        expect(toObjectLike(parseQueryString("user=name"))).toEqual({ user: "name" });
    });

    test("multiple key-value", () => {
        expect(toObjectLike(parseQueryString("user=name&pass=word"))).toEqual({
            user: "name",
            pass: "word",
        });
    });

    test("duplicate key jadi array", () => {
        expect(toObjectLike(parseQueryString("user=a&user=b"))).toEqual({ user: ["a", "b"] });
        expect(toObjectLike(parseQueryString("user=a&user=b&user=c"))).toEqual({
            user: ["a", "b", "c"],
        });
    });

    test("value kosong", () => {
        expect(toObjectLike(parseQueryString("user="))).toEqual({ user: "" });
        expect(toObjectLike(parseQueryString("user=&pass=word"))).toEqual({
            user: "",
            pass: "word",
        });
    });

    test("name kosong", () => {
        expect(toObjectLike(parseQueryString("=value"))).toEqual({ "": "value" });
    });

    test("decode URI", () => {
        expect(toObjectLike(parseQueryString("user=hello%20world"))).toEqual({
            user: "hello world",
        });
        expect(toObjectLike(parseQueryString("user=%E4%B8%AD"))).toEqual({ user: "中" });
    });

    test("decode gagal — fallback raw", () => {
        expect(toObjectLike(parseQueryString("user=%"))).toEqual({ user: "%" });
        expect(toObjectLike(parseQueryString("user=%E4%B8"))).toEqual({ user: "%E4%B8" });
    });

    test("trailing ampersand", () => {
        expect(toObjectLike(parseQueryString("user=name&"))).toEqual({ user: "name" });
    });

    test("leading ampersand", () => {
        expect(toObjectLike(parseQueryString("&user=name"))).toEqual({ user: "name" });
    });

    test("double ampersand", () => {
        expect(toObjectLike(parseQueryString("user=name&&pass=word"))).toEqual({
            user: "name",
            pass: "word",
        });
    });

    test("plus nggak jadi spasi", () => {
        // Beda dari URLSearchParams
        expect(toObjectLike(parseQueryString("user=hello+world"))).toEqual({
            user: "hello+world",
        });
    });

    test("key tanpa value (tanpa =) — nggak ke-parse", () => {
        // Beda dari URLSearchParams
        expect(toObjectLike(parseQueryString("user"))).toEqual({});
        expect(toObjectLike(parseQueryString("user&pass"))).toEqual({});
    });

    test("kombinasi rumit", () => {
        expect(toObjectLike(parseQueryString("a=1&b=2&a=3&c=%20"))).toEqual({
            a: ["1", "3"],
            b: "2",
            c: " ",
        });
    });

    test("prototype pollution — Object.create(null)", () => {
        const result = toObjectLike(parseQueryString("__proto__=polluted"));
        // Karena Object.create(null), __proto__ jadi key biasa
        expect(result.__proto__).toBe("polluted");
        expect({}.polluted).toBe(undefined);
    });

    test("empty value + duplicate", () => {
        expect(toObjectLike(parseQueryString("a=&a=b"))).toEqual({
            a: ["", "b"],
        });
    });

    test("empty name", () => {
        expect(toObjectLike(parseQueryString("=b"))).toEqual({ "": "b" });
        expect(toObjectLike(parseQueryString("="))).toEqual({ "": "" });
    });

    test("decode gagal di name", () => {
        expect(toObjectLike(parseQueryString("%=b"))).toEqual({ "%": "b" });
    });

    test("decode gagal di value", () => {
        expect(toObjectLike(parseQueryString("a=%"))).toEqual({ a: "%" });
    });

    test("decode gagal di dua-duanya", () => {
        expect(toObjectLike(parseQueryString("%=%"))).toEqual({ "%": "%" });
    });
});
