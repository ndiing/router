const { cors } = require("../src/middleware/cors");

function makeReq({ method = "GET", headers = {} } = {}) {
    return { method, headers };
}

function makeRes() {
    const headers = Object.create(null);
    return {
        statusCode: 200,
        ended: false,
        headers,
        setHeader(name, value) {
            headers[name.toLowerCase()] = value;
        },
        appendHeader(name, value) {
            const key = name.toLowerCase();
            if (headers[key] === undefined) headers[key] = value;
            else headers[key] = `${headers[key]}, ${value}`;
        },
        end() {
            this.ended = true;
        },
    };
}

function run(mw, req) {
    const res = makeRes();
    mw(req, res);
    return res;
}

describe("cors", () => {
    describe("default options (origin: *)", () => {
        test("sets wildcard origin for simple request", () => {
            const mw = cors();
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-allow-origin"]).toBe("*");
        });

        test("does not set Vary for wildcard", () => {
            const mw = cors();
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["vary"]).toBe(undefined);
        });

        test("does not end response for GET", () => {
            const mw = cors();
            const res = run(mw, makeReq());
            expect(res.ended).toBe(false);
        });
    });

    describe("explicit origin", () => {
        test("echoes matching origin", () => {
            const mw = cors({ origin: "https://x.com" });
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-allow-origin"]).toBe("https://x.com");
        });

        test("sets Vary: Origin when echoed", () => {
            const mw = cors({ origin: "https://x.com" });
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["vary"]).toBe("Origin");
        });

        test("does not set header for non-matching origin", () => {
            const mw = cors({ origin: "https://x.com" });
            const res = run(mw, makeReq({ headers: { origin: "https://evil.com" } }));
            expect(res.headers["access-control-allow-origin"]).toBe(undefined);
        });

        test("array origin matches one", () => {
            const mw = cors({ origin: ["https://a.com", "https://b.com"] });
            const res = run(mw, makeReq({ headers: { origin: "https://b.com" } }));
            expect(res.headers["access-control-allow-origin"]).toBe("https://b.com");
        });

        test("array origin no match", () => {
            const mw = cors({ origin: ["https://a.com", "https://b.com"] });
            const res = run(mw, makeReq({ headers: { origin: "https://c.com" } }));
            expect(res.headers["access-control-allow-origin"]).toBe(undefined);
        });
    });

    describe("origin: null (security)", () => {
        test("does not set null origin", () => {
            const mw = cors({ origin: null });
            const res = run(mw, makeReq({ headers: { origin: "null" } }));
            expect(res.headers["access-control-allow-origin"]).toBe(undefined);
        });

        test("does not set for any origin", () => {
            const mw = cors({ origin: null });
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-allow-origin"]).toBe(undefined);
        });
    });

    describe("credentials", () => {
        test("sets allow-credentials", () => {
            const mw = cors({ credentials: true, origin: "https://x.com" });
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-allow-credentials"]).toBe("true");
        });

        test("wildcard + credentials echoes origin", () => {
            const mw = cors({ credentials: true, origin: "*" });
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-allow-origin"]).toBe("https://x.com");
        });

        test("wildcard + credentials sets Vary", () => {
            const mw = cors({ credentials: true, origin: "*" });
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["vary"]).toBe("Origin");
        });
    });

    describe("preflight", () => {
        const preflightReq = (extra = {}) =>
            makeReq({
                method: "OPTIONS",
                headers: {
                    origin: "https://x.com",
                    "access-control-request-method": "POST",
                    ...extra,
                },
            });

        test("ends response with 204", () => {
            const mw = cors();
            const res = run(mw, preflightReq());
            expect(res.statusCode).toBe(204);
            expect(res.ended).toBe(true);
        });

        test("sets content-length 0", () => {
            const mw = cors();
            const res = run(mw, preflightReq());
            expect(res.headers["content-length"]).toBe("0");
        });

        test("sets allow-methods echo when methods undefined", () => {
            const mw = cors();
            const res = run(mw, preflightReq());
            expect(res.headers["access-control-allow-methods"]).toEqual(["POST"]);
        });

        test("sets allow-methods when methods configured and match", () => {
            const mw = cors({ methods: ["GET", "POST"] });
            const res = run(mw, preflightReq());
            expect(res.headers["access-control-allow-methods"]).toEqual(["GET", "POST"]);
        });

        test("does not set allow-methods when configured but no match", () => {
            const mw = cors({ methods: ["GET"] });
            const res = run(mw, preflightReq({ "access-control-request-method": "DELETE" }));
            expect(res.headers["access-control-allow-methods"]).toBe(undefined);
        });

        test("sets allow-headers echo when headers undefined", () => {
            const mw = cors();
            const res = run(mw, preflightReq({ "access-control-request-headers": "X-Custom, Content-Type" }));
            expect(res.headers["access-control-allow-headers"]).toEqual(["x-custom", "content-type"]);
        });

        test("sets allow-headers when all requested allowed", () => {
            const mw = cors({ headers: ["x-custom", "content-type"] });
            const res = run(mw, preflightReq({ "access-control-request-headers": "X-Custom, Content-Type" }));
            expect(res.headers["access-control-allow-headers"]).toEqual(["x-custom", "content-type"]);
        });

        test("does not set allow-headers when some not allowed", () => {
            const mw = cors({ headers: ["x-custom"] });
            const res = run(mw, preflightReq({ "access-control-request-headers": "X-Custom, X-Other" }));
            expect(res.headers["access-control-allow-headers"]).toBe(undefined);
        });

        test("sets max-age when > 0", () => {
            const mw = cors({ maxAge: 3600 });
            const res = run(mw, preflightReq());
            expect(res.headers["access-control-max-age"]).toBe(3600);
        });

        test("does not set max-age when 0", () => {
            const mw = cors({ maxAge: 0 });
            const res = run(mw, preflightReq());
            expect(res.headers["access-control-max-age"]).toBe(undefined);
        });

        test("preflight sets Vary: Origin for explicit origin", () => {
            const mw = cors({ origin: "https://x.com" });
            const res = run(mw, preflightReq());
            expect(res.headers["vary"]).toBe("Origin");
        });

        test("preflight wildcard does not set Vary", () => {
            const mw = cors();
            const res = run(mw, preflightReq());
            expect(res.headers["vary"]).toBe(undefined);
        });

        test("sets allow-headers wildcard when headers='*' and no credentials", () => {
            const mw = cors({ headers: "*" });
            const res = run(mw, preflightReq({ "access-control-request-headers": "X-Custom" }));
            expect(res.headers["access-control-allow-headers"]).toBe("*");
        });

        test("sets allow-methods wildcard when methods='*' and no credentials", () => {
            const mw = cors({ methods: "*" });
            const res = run(mw, preflightReq());
            expect(res.headers["access-control-allow-methods"]).toBe("*");
        });
    });

    describe("OPTIONS non-preflight", () => {
        test("does not end response", () => {
            const mw = cors();
            // OPTIONS tanpa Access-Control-Request-Method = bukan preflight
            const res = run(mw, makeReq({ method: "OPTIONS", headers: { origin: "https://x.com" } }));
            expect(res.ended).toBe(false);
        });

        test("sets allow-origin", () => {
            const mw = cors();
            const res = run(mw, makeReq({ method: "OPTIONS", headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-allow-origin"]).toBe("*");
        });
    });

    describe("expose headers", () => {
        test("sets expose-headers when configured", () => {
            const mw = cors({ headers: ["x-custom", "x-other"] });
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-expose-headers"]).toEqual(["x-custom", "x-other"]);
        });

        test("does not set expose-headers when not configured", () => {
            const mw = cors();
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-expose-headers"]).toBe(undefined);
        });

        test("wildcard + no credentials sets *", () => {
            const mw = cors({ headers: "*" });
            const res = run(mw, makeReq({ headers: { origin: "https://x.com" } }));
            expect(res.headers["access-control-expose-headers"]).toBe("*");
        });
    });
});
