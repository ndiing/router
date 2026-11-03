require("../src/polyfill");
const { decodeParam, parseQueryString, parseUrl, parseCookie, buildCookie, isValidCookieName, decodeCookie, encodeCookie } = require("../src/util");

describe("decodeParam", () => {
    test("decodes URI components", () => {
        expect(decodeParam("hello%20world")).toBe("hello world");
    });
    test("returns raw on invalid encoding", () => {
        expect(decodeParam("%E0%A4%A")).toBe("%E0%A4%A");
    });
});

describe("parseQueryString", () => {
    test("empty -> empty", () => {
        expect(Object.keys(parseQueryString("")).length).toBe(0);
    });
    test("single value", () => {
        const q = parseQueryString("a=1&b=2");
        expect(q.a).toBe("1");
        expect(q.b).toBe("2");
    });
    test("repeated -> array", () => {
        const q = parseQueryString("a=1&a=2&a=3");
        expect(q.a).toEqual(["1", "2", "3"]);
    });
    test("url-encoded values", () => {
        expect(parseQueryString("name=hello%20world").name).toBe("hello world");
    });
    test("no prototype pollution", () => {
        expect(Object.getPrototypeOf(parseQueryString("__proto__=x"))).toBe(null);
    });
});

describe("parseUrl", () => {
    test("plain path", () => {
        expect(parseUrl("/foo")).toEqual({ path: "/foo", queryString: "", hash: "" });
    });
    test("with query", () => {
        expect(parseUrl("/foo?a=1")).toEqual({ path: "/foo", queryString: "a=1", hash: "" });
    });
    test("with hash", () => {
        expect(parseUrl("/foo#bar")).toEqual({ path: "/foo", queryString: "", hash: "bar" });
    });
    test("with both", () => {
        expect(parseUrl("/foo?a=1#bar")).toEqual({ path: "/foo", queryString: "a=1", hash: "bar" });
    });
});

describe("encode/decodeCookie", () => {
    test("roundtrip", () => {
        expect(decodeCookie(encodeCookie("a b&c"))).toBe("a b&c");
    });
    test("invalid decode returns raw", () => {
        expect(decodeCookie("%E0%A4%A")).toBe("%E0%A4%A");
    });
});

describe("parseCookie", () => {
    test("empty string", () => {
        expect(Object.keys(parseCookie("")).length).toBe(0);
    });
    test("simple", () => {
        const c = parseCookie("a=1; b=2");
        expect(c.a).toBe("1");
        expect(c.b).toBe("2");
    });
    test("decodes values", () => {
        expect(parseCookie("name=hello%20world").name).toBe("hello world");
    });
    test("repeated -> array", () => {
        expect(parseCookie("a=1; a=2").a).toEqual(["1", "2"]);
    });
    test("ignores malformed", () => {
        const c = parseCookie("a=1; bad; b=2");
        expect(c.a).toBe("1");
        expect(c.b).toBe("2");
        expect(c.bad).toBe(undefined);
    });
    test("no prototype pollution", () => {
        expect(Object.getPrototypeOf(parseCookie("__proto__=x"))).toBe(null);
    });
});

describe("isValidCookieName", () => {
    test("valid", () => {
        expect(isValidCookieName("session")).toBe(true);
        expect(isValidCookieName("a-b_c.d")).toBe(true);
    });
    test("invalid", () => {
        expect(isValidCookieName("a b")).toBe(false);
        expect(isValidCookieName("a=b")).toBe(false);
        expect(isValidCookieName("")).toBe(false);
    });
});

describe("buildCookie", () => {
    test("basic", () => {
        expect(buildCookie("a", "1")).toBe("a=1; Path=/; SameSite=Lax");
    });
    test("with all options", () => {
        const cookie = buildCookie({
            name: "session",
            value: "abc",
            domain: "example.com",
            maxAge: 3600,
            httpOnly: true,
            secure: true,
            path: "/app",
            sameSite: "Strict",
        });
        expect(cookie).toContain("session=abc");
        expect(cookie).toContain("Domain=example.com");
        expect(cookie).toContain("Max-Age=3600");
        expect(cookie).toContain("Path=/app");
        expect(cookie).toContain("SameSite=Strict");
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("Secure");
    });
    test("throws on invalid name", () => {
        expect(() => buildCookie("bad name", "x")).toThrow("Invalid Cookie Name");
    });
    test("throws on missing value", () => {
        expect(() => buildCookie("a", undefined)).toThrow("Cookie value is required");
    });
    test("expires date formatting", () => {
        const date = new Date("2026-01-01T00:00:00Z").getTime();
        const cookie = buildCookie({ name: "a", value: "1", expires: date });
        expect(cookie).toContain("Thu, 01 Jan 2026 00:00:00 GMT");
    });
});

test("encodeCookie returns raw on invalid surrogate", () => {
    expect(encodeCookie("\uD800")).toBe("\uD800");
});

test("buildCookie with partitioned", () => {
    const c = buildCookie({ name: "a", value: "1", partitioned: true });
    expect(c).toContain("Partitioned");
});
