require("../../src/polyfill");
const { json } = require("../../src/middleware/json");

function makeReq({ method = "POST", headers = {}, body = [] } = {}) {
    return {
        method,
        headers,
        async *[Symbol.asyncIterator]() {
            for (const c of body) yield Buffer.from(c);
        },
    };
}

function makeRes() {
    return { statusCode: 200, done: false };
}

async function expectRejects(promise, substring) {
    try {
        await promise;
        throw new Error("expected rejection but resolved");
    } catch (err) {
        expect(err.message).toContain(substring);
    }
}

describe("json middleware", () => {
    test("skips when body already parsed", async () => {
        const req = makeReq();
        req.body = { pre: true };
        await json()(req, makeRes());
        expect(req.body.pre).toBe(true);
    });
    test("skips non-body methods", async () => {
        const req = makeReq({ method: "GET" });
        await json()(req, makeRes());
        expect(req.body).toBe(undefined);
    });
    test("skips wrong content-type", async () => {
        const req = makeReq({ headers: { "content-type": "text/plain" } });
        await json()(req, makeRes());
        expect(req.body).toBe(undefined);
    });
    test("parses valid JSON", async () => {
        const req = makeReq({
            headers: { "content-type": "application/json" },
            body: ['{"a":1}'],
        });
        await json()(req, makeRes());
        expect(req.body).toEqual({ a: 1 });
    });
    test("empty body -> null", async () => {
        const req = makeReq({ headers: { "content-type": "application/json" } });
        await json()(req, makeRes());
        expect(req.body).toBe(null);
    });
    test("invalid JSON throws 400", async () => {
        const res = makeRes();
        const req = makeReq({
            headers: { "content-type": "application/json" },
            body: ["{invalid"],
        });
        await expectRejects(json()(req, res), "Bad Request");
        expect(res.statusCode).toBe(400);
    });
    test("content-length over limit -> 413", async () => {
        const res = makeRes();
        const req = makeReq({
            headers: { "content-type": "application/json", "content-length": "999999" },
        });
        await expectRejects(json({ limit: 10 })(req, res), "Payload Too Large");
        expect(res.statusCode).toBe(413);
    });
    test("chunked body over limit -> 413", async () => {
        const res = makeRes();
        const req = makeReq({
            headers: { "content-type": "application/json" },
            body: ["1234567890", "more"],
        });
        await expectRejects(json({ limit: 5 })(req, res), "Payload Too Large");
        expect(res.statusCode).toBe(413);
    });
    test("reviver strips __proto__", async () => {
        const req = makeReq({
            headers: { "content-type": "application/json" },
            body: ['{"a":1,"__proto__":{"x":1}}'],
        });
        await json()(req, makeRes());
        expect(req.body.a).toBe(1);
        expect(req.body.__proto__.x).toBe(undefined);
    });
});
