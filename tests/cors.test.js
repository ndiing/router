const { cors } = require("../src/middleware/cors");

function makeReq({ method = "GET", headers = {} } = {}) {
    return { method, headers };
}

function makeRes() {
    return {
        statusCode: 200,
        headers: {},
        ended: false,
        setHeader(k, v) {
            this.headers[k.toLowerCase()] = v;
        },
        appendHeader(k, v) {
            const key = k.toLowerCase();
            if (this.headers[key]) this.headers[key] += ", " + v;
            else this.headers[key] = v;
        },
        end() {
            this.ended = true;
        },
    };
}

describe("middleware/cors", () => {
    test("origin * sets wildcard", () => {
        const mw = cors({ origin: "*" });
        const req = makeReq();
        const res = makeRes();
        mw(req, res);
        expect(res.headers["access-control-allow-origin"]).toBe("*");
    });

    test("origin with credentials echoes origin", () => {
        const mw = cors({ origin: "*", credentials: true });
        const req = makeReq({ headers: { origin: "http://example.com" } });
        const res = makeRes();
        mw(req, res);
        expect(res.headers["access-control-allow-origin"]).toBe("http://example.com");
        expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    test("explicit origin list", () => {
        const mw = cors({ origin: ["http://a.com", "http://b.com"] });
        const req = makeReq({ headers: { origin: "http://a.com" } });
        const res = makeRes();
        mw(req, res);
        expect(res.headers["access-control-allow-origin"]).toBe("http://a.com");
        expect(res.headers["vary"]).toContain("Origin");
    });

    test("preflight returns 204 and ends", () => {
        const mw = cors({ origin: "*" });
        const req = makeReq({
            method: "OPTIONS",
            headers: {
                "access-control-request-method": "POST",
                "access-control-request-headers": "content-type",
            },
        });
        const res = makeRes();
        mw(req, res);
        expect(res.statusCode).toBe(204);
        expect(res.ended).toBe(true);
        expect(res.headers["access-control-allow-methods"]).toContain("POST");
        expect(res.headers["access-control-allow-headers"]).toContain("content-type");
    });
});

test("origin not in list sets no header", () => {
    const mw = cors({ origin: ["http://a.com"] });
    const req = makeReq({ headers: { origin: "http://evil.com" } });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-allow-origin"]).toBe(undefined);
});

test("explicit origin * with credentials", () => {
    const mw = cors({ origin: "*", credentials: true });
    const req = makeReq({ headers: { origin: "http://a.com" } });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-allow-origin"]).toBe("http://a.com");
});

test("preflight with headers array rejects partial", () => {
    const mw = cors({ headers: ["content-type"] });
    const req = makeReq({
        method: "OPTIONS",
        headers: {
            "access-control-request-method": "POST",
            "access-control-request-headers": "content-type, x-evil",
        },
    });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-allow-headers"]).toBe(undefined);
});

test("maxAge sets header when > 0", () => {
    const mw = cors({ maxAge: 3600 });
    const req = makeReq({
        method: "OPTIONS",
        headers: { "access-control-request-method": "POST" },
    });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-max-age"]).toBe(3600);
});

test("origin explicit not matching sets no header", () => {
    const mw = cors({ origin: "http://a.com" });
    const req = makeReq({ headers: { origin: "http://evil.com" } });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-allow-origin"]).toBe(undefined);
});

test("headers array rejects partial match", () => {
    const mw = cors({ headers: ["content-type"] });
    const req = makeReq({
        method: "OPTIONS",
        headers: {
            "access-control-request-method": "POST",
            "access-control-request-headers": "content-type, x-evil",
        },
    });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-allow-headers"]).toBe(undefined);
});

test("methods array rejects unlisted method", () => {
    const mw = cors({ methods: ["GET"] });
    const req = makeReq({
        method: "OPTIONS",
        headers: { "access-control-request-method": "POST" },
    });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-allow-methods"]).toBe(undefined);
});

test("expose headers with * and no credentials", () => {
    const mw = cors({ headers: "*" });
    const req = makeReq({ headers: { origin: "http://a.com" } });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-expose-headers"]).toBe("*");
});
test("headers * sets wildcard when no credentials", () => {
    const mw = cors({ headers: "*" });
    const req = makeReq({
        method: "OPTIONS",
        headers: {
            "access-control-request-method": "POST",
            "access-control-request-headers": "content-type",
        },
    });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-allow-headers"]).toBe("*");
});
test("methods * sets wildcard when no credentials", () => {
    const mw = cors({ methods: "*" });
    const req = makeReq({
        method: "OPTIONS",
        headers: { "access-control-request-method": "POST" },
    });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-allow-methods"]).toBe("*");
});
test("expose headers array set on simple request", () => {
    const mw = cors({ headers: ["x-custom", "x-another"] });
    const req = makeReq({ headers: { origin: "http://a.com" } });
    const res = makeRes();
    mw(req, res);
    expect(res.headers["access-control-expose-headers"]).toEqual(["x-custom", "x-another"]);
});
