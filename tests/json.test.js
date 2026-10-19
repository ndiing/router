const { json } = require("../src/middleware/json");

// helper: bikin req palsu yang async-iterable
function makeReq({ method = "POST", headers = {}, body = null } = {}) {
    const chunks = body === null ? [] : [Buffer.from(body)];
    return {
        method,
        headers,
        async *[Symbol.asyncIterator]() {
            for (const chunk of chunks) yield chunk;
        },
    };
}

// helper: bikin res palsu minimal
function makeRes() {
    return { statusCode: 200 };
}

// helper: jalankan middleware dan return error (atau null kalau sukses)
async function run(mw, req, res) {
    try {
        await mw(req, res);
        return null;
    } catch (err) {
        return err;
    }
}

describe("json", () => {
    describe("method filter", () => {
        test("skips GET", async () => {
            const req = makeReq({ method: "GET" });
            const err = await run(json(), req, makeRes());
            expect(err).toBe(null);
            expect(req.body).toBe(undefined);
        });

        test("skips DELETE", async () => {
            const req = makeReq({ method: "DELETE" });
            const err = await run(json(), req, makeRes());
            expect(err).toBe(null);
            expect(req.body).toBe(undefined);
        });

        test("processes POST", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: '{"a":1}',
            });
            const err = await run(json(), req, makeRes());
            expect(err).toBe(null);
            expect(req.body.a).toBe(1);
        });

        test("processes PUT", async () => {
            const req = makeReq({
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: '{"a":1}',
            });
            const err = await run(json(), req, makeRes());
            expect(err).toBe(null);
            expect(req.body.a).toBe(1);
        });

        test("processes PATCH", async () => {
            const req = makeReq({
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: '{"a":1}',
            });
            const err = await run(json(), req, makeRes());
            expect(err).toBe(null);
            expect(req.body.a).toBe(1);
        });
    });

    describe("content-type filter", () => {
        test("skips without content-type", async () => {
            const req = makeReq({ method: "POST", body: '{"a":1}' });
            const err = await run(json(), req, makeRes());
            expect(err).toBe(null);
            expect(req.body).toBe(undefined);
        });

        test("skips non-json content-type", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "text/plain" },
                body: '{"a":1}',
            });
            const err = await run(json(), req, makeRes());
            expect(err).toBe(null);
            expect(req.body).toBe(undefined);
        });

        test("accepts application/json with charset", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json; charset=utf-8" },
                body: '{"a":1}',
            });
            const err = await run(json(), req, makeRes());
            expect(err).toBe(null);
            expect(req.body.a).toBe(1);
        });
    });

    describe("body parsing", () => {
        test("parses valid JSON object", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: '{"user":"name","pass":"word"}',
            });
            await run(json(), req, makeRes());
            expect(req.body.user).toBe("name");
            expect(req.body.pass).toBe("word");
        });

        test("parses JSON array", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "[1,2,3]",
            });
            await run(json(), req, makeRes());
            expect(req.body).toEqual([1, 2, 3]);
        });

        test("parses JSON primitive", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: '"hello"',
            });
            await run(json(), req, makeRes());
            expect(req.body).toBe("hello");
        });

        test("empty body sets body to null", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
            });
            await run(json(), req, makeRes());
            expect(req.body).toBe(null);
        });

        test("invalid JSON throws 400", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{not json}",
            });
            const res = makeRes();
            const err = await run(json(), req, res);
            expect(err !== null).toBe(true);
            expect(res.statusCode).toBe(400);
        });

        test("400 error has cause", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{not json}",
            });
            const err = await run(json(), req, makeRes());
            expect(err.cause !== undefined).toBe(true);
        });
    });

    describe("prototype pollution protection", () => {
        test("removes __proto__ key", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: '{"__proto__":{"polluted":true},"a":1}',
            });
            await run(json(), req, makeRes());
            expect(Object.hasOwn(req.body, "__proto__")).toBe(false);
            expect({}.polluted).toBe(undefined);
        });

        test("removes constructor key", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: '{"constructor":{"prototype":{"polluted":true}},"a":1}',
            });
            await run(json(), req, makeRes());
            expect(Object.hasOwn(req.body, "constructor")).toBe(false);
        });

        test("removes prototype key", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: '{"prototype":{"polluted":true},"a":1}',
            });
            await run(json(), req, makeRes());
            expect(Object.hasOwn(req.body, "prototype")).toBe(false);
        });

        test("keeps normal keys", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: '{"a":1,"b":2}',
            });
            await run(json(), req, makeRes());
            expect(req.body.a).toBe(1);
            expect(req.body.b).toBe(2);
        });
    });

    describe("limit", () => {
        test("rejects content-length over limit", async () => {
            const req = makeReq({
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "content-length": "1000",
                },
                body: '{"a":1}',
            });
            const res = makeRes();
            const err = await run(json({ limit: 10 }), req, res);
            expect(err !== null).toBe(true);
            expect(res.statusCode).toBe(413);
        });

        test("accepts content-length equal to limit", async () => {
            const body = '{"a":1}'; // 7 bytes
            const req = makeReq({
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "content-length": String(body.length),
                },
                body,
            });
            const err = await run(json({ limit: body.length }), req, makeRes());
            expect(err).toBe(null);
            expect(req.body.a).toBe(1);
        });

        test("rejects streaming body over limit (no content-length)", async () => {
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: '{"a":"aaaaaaaaaaaaaaaaaaaa"}',
            });
            const res = makeRes();
            const err = await run(json({ limit: 5 }), req, res);
            expect(err !== null).toBe(true);
            expect(res.statusCode).toBe(413);
        });

        test("default limit is 100KB", async () => {
            const big = '{"a":"' + "x".repeat(100 * 1024) + '"}';
            const req = makeReq({
                method: "POST",
                headers: { "content-type": "application/json" },
                body: big,
            });
            const res = makeRes();
            const err = await run(json(), req, res);
            expect(err !== null).toBe(true);
            expect(res.statusCode).toBe(413);
        });
    });
});

test("processes QUERY", async () => {
    const req = makeReq({
        method: "QUERY",
        headers: { "content-type": "application/json" },
        body: '{"filter":{"age":{"$gt":18}}}',
    });
    const err = await run(json(), req, makeRes());
    expect(err).toBe(null);
    expect(req.body.filter.age.$gt).toBe(18);
});
