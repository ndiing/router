require("../../src/polyfill");
const { urlencoded } = require("../../src/middleware/urlencoded");

function makeReq({ method = "POST", headers = {}, body = [] } = {}) {
    return {
        method,
        headers,
        async *[Symbol.asyncIterator]() {
            for (const c of body) yield Buffer.from(c);
        },
    };
}

async function expectRejects(promise, substring) {
    try {
        await promise;
        throw new Error("expected rejection but resolved");
    } catch (err) {
        expect(err.message).toContain(substring);
    }
}

describe("urlencoded middleware", () => {
    test("skips GET", async () => {
        const req = makeReq({ method: "GET" });
        await urlencoded()(req, {});
        expect(req.body).toBe(undefined);
    });
    test("skips wrong content-type", async () => {
        const req = makeReq({ headers: { "content-type": "application/json" } });
        await urlencoded()(req, {});
        expect(req.body).toBe(undefined);
    });
    test("parses form data", async () => {
        const req = makeReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: ["a=1&b=2"],
        });
        await urlencoded()(req, {});
        expect(req.body.a).toBe("1");
        expect(req.body.b).toBe("2");
    });
    test("repeated -> array", async () => {
        const req = makeReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: ["a=1&a=2"],
        });
        await urlencoded()(req, {});
        expect(req.body.a).toEqual(["1", "2"]);
    });
    test("empty body -> null", async () => {
        const req = makeReq({ headers: { "content-type": "application/x-www-form-urlencoded" } });
        await urlencoded()(req, {});
        expect(req.body).toBe(null);
    });
    test("limit exceeded -> 413", async () => {
        const res = { statusCode: 200 };
        const req = makeReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: ["1234567890"],
        });
        await expectRejects(urlencoded({ limit: 5 })(req, res), "Payload Too Large");
        expect(res.statusCode).toBe(413);
    });
    test("skips if body already parsed", async () => {
        const req = makeReq({ headers: { "content-type": "application/x-www-form-urlencoded" } });
        req.body = { pre: 1 };
        await urlencoded()(req, {});
        expect(req.body.pre).toBe(1);
    });
});
