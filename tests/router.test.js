require("../src/polyfill");
const { Router } = require("../src/router");

const handler = () => {};
const errHandler = (err, req, res) => {};

describe("Router - basic registration", () => {
    test("get registers handler", () => {
        const r = new Router();
        r.get("/hello", handler);
        const res = r.find("GET", "/hello");
        expect(Object.values(res.handlers).includes(handler)).toBe(true);
    });
    test("post registers handler", () => {
        const r = new Router();
        r.post("/x", handler);
        expect(Object.values(r.find("POST", "/x").handlers).includes(handler)).toBe(true);
    });
    test("all HTTP methods", () => {
        const r = new Router();
        for (const m of ["get", "post", "put", "delete", "patch", "head", "options", "trace", "connect"]) {
            r[m](`/${m}`, handler);
        }
        expect(Object.values(r.find("GET", "/get").handlers).includes(handler)).toBe(true);
        expect(Object.values(r.find("DELETE", "/delete").handlers).includes(handler)).toBe(true);
    });
    test("use registers ALL handler", () => {
        const r = new Router();
        r.use(handler);
        expect(Object.values(r.find("GET", "/anything").handlers).includes(handler)).toBe(true);
    });
    test("error handler (3 params) goes to CATCH", () => {
        const r = new Router();
        r.use("/api", errHandler);
        expect(Object.values(r.find("GET", "/api/x").errorHandlers).includes(errHandler)).toBe(true);
    });
});

describe("Router - params", () => {
    test("simple param", () => {
        const r = new Router();
        r.get("/user/:id", handler);
        expect(r.find("GET", "/user/42").params.id).toBe("42");
    });
    test("multiple params", () => {
        const r = new Router();
        r.get("/u/:userId/p/:postId", handler);
        const res = r.find("GET", "/u/7/p/99");
        expect(res.params.userId).toBe("7");
        expect(res.params.postId).toBe("99");
    });
    test("url-encoded param", () => {
        const r = new Router();
        r.get("/user/:name", handler);
        expect(r.find("GET", "/user/hello%20world").params.name).toBe("hello world");
    });
});

describe("Router - wildcard", () => {
    test("wildcard matches rest", () => {
        const r = new Router();
        r.get("/files/*", handler);
        const res = r.find("GET", "/files/a/b/c");
        expect(Object.values(res.handlers).includes(handler)).toBe(true);
        expect(res.params.wildcard).toBe("a/b/c");
    });
});

describe("Router - middleware ordering", () => {
    test("middleware seq < handler seq", () => {
        const r = new Router();
        const mw = () => {};
        const h = () => {};
        r.use(mw);
        r.get("/x", h);
        const res = r.find("GET", "/x");
        const ordered = Object.entries(res.handlers)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([, fn]) => fn);
        expect(ordered.length >= 2).toBe(true);
        expect(ordered[0]).toBe(mw);
        expect(ordered[ordered.length - 1]).toBe(h);
    });
});

describe("Router - nested router (mounting)", () => {
    test("sub router merges with prefix", () => {
        const sub = new Router();
        sub.get("/hi", handler);
        const r = new Router();
        r.use("/api", sub);
        expect(Object.values(r.find("GET", "/api/hi").handlers).includes(handler)).toBe(true);
    });
});

describe("Router - trailing slash", () => {
    test("matches without trailing slash", () => {
        const r = new Router();
        r.get("/foo", handler);
        expect(Object.values(r.find("GET", "/foo/").handlers).includes(handler)).toBe(true);
    });
    test("matches with trailing slash added", () => {
        const r = new Router();
        r.get("/foo/", handler);
        expect(Object.values(r.find("GET", "/foo").handlers).includes(handler)).toBe(true);
    });
});

describe("Router - no match", () => {
    test("returns empty", () => {
        const r = new Router();
        const res = r.find("GET", "/nothing");
        expect(Object.keys(res.handlers).length).toBe(0);
        expect(Object.keys(res.errorHandlers).length).toBe(0);
    });
});

describe("Router - 404 fallback state", () => {
    test("collects ALL handlers from longest partial match", () => {
        const r = new Router();
        const mw = () => {};
        r.use("/foo", mw);
        const res = r.find("GET", "/foo/bar");
        expect(Object.values(res.handlers).includes(mw)).toBe(true);
    });
});

test("walk splits node when prefix overlaps", () => {
    const r = new Router();
    const a = () => {};
    const b = () => {};
    r.get("/foo", a);
    r.get("/foobar", b);
    expect(Object.values(r.find("GET", "/foo").handlers).includes(a)).toBe(true);
    expect(Object.values(r.find("GET", "/foobar").handlers).includes(b)).toBe(true);
});

// test("path-less registration", () => {
//   const r = new Router();
//   const h = () => {};
//   r.get(h); // path=null, handler langsung
//   expect(Object.values(r.find("GET", "/").handlers).includes(h)).toBe(true);
// });
