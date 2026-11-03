require("../src/polyfill");
const { Request } = require("../src/request");

function makeReq(url, headers = {}) {
    const req = Object.create(Request.prototype);
    req.url = url;
    req.headers = headers;
    return req;
}

describe("Request.path / query", () => {
    test("path only", () => {
        const r = makeReq("/foo");
        expect(r.path).toBe("/foo");
        expect(r.query.a).toBe(undefined);
    });
    test("path + query", () => {
        const r = makeReq("/foo?a=1&b=2");
        r.path;
        expect(r.query.a).toBe("1");
        expect(r.query.b).toBe("2");
    });
    test("repeated query -> array", () => {
        const r = makeReq("/x?a=1&a=2");
        r.path;
        expect(r.query.a).toEqual(["1", "2"]);
    });
});

describe("Request.cookies", () => {
    test("no cookie header -> empty", () => {
        const r = makeReq("/", {});
        expect(r.cookies.a).toBe(undefined);
        expect(Object.getPrototypeOf(r.cookies)).toBe(null);
    });
    test("parses cookie header", () => {
        const r = makeReq("/", { cookie: "a=1; b=2" });
        expect(r.cookies.a).toBe("1");
        expect(r.cookies.b).toBe("2");
    });
});

describe("Request.controller", () => {
    test("lazy AbortController", () => {
        const r = makeReq("/");
        const c = r.controller;
        expect(c instanceof AbortController).toBe(true);
        expect(r.controller).toBe(c);
    });
});
