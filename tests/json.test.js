const { json } = require("../src/middleware/json");

function makeReq({ method = "POST", headers = {}, body = "" } = {}) {
    const chunks = body ? [Buffer.from(body)] : [];
    return {
        method,
        headers,
        async *[Symbol.asyncIterator]() {
            for (const c of chunks) yield c;
        },
    };
}

function makeRes() {
    return {
        statusCode: 200,
        headers: {},
        setHeader(k, v) {
            this.headers[k.toLowerCase()] = v;
        },
    };
}

describe("middleware/json", () => {
    test("skips GET", async () => {
        const mw = json();
        const req = makeReq({ method: "GET" });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toBe(undefined);
    });

    test("skips non-json content-type", async () => {
        const mw = json();
        const req = makeReq({
            headers: { "content-type": "text/plain" },
            body: "hello",
        });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toBe(undefined);
    });

    test("parses JSON body", async () => {
        const mw = json();
        const req = makeReq({
            headers: { "content-type": "application/json" },
            body: '{"name":"budi"}',
        });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toEqual({ name: "budi" });
    });

    test("empty body sets null", async () => {
        const mw = json();
        const req = makeReq({
            headers: { "content-type": "application/json" },
        });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toBe(null);
    });

    test("invalid JSON throws 400", async () => {
        const mw = json();
        const req = makeReq({
            headers: { "content-type": "application/json" },
            body: "{invalid",
        });
        const res = makeRes();

        let threw = false;
        try {
            await mw(req, res);
        } catch {
            threw = true;
        }
        expect(threw).toBe(true);
        expect(res.statusCode).toBe(400);
    });

    test("content-length over limit returns 413", async () => {
        const mw = json({ limit: 10 });
        const req = makeReq({
            headers: {
                "content-type": "application/json",
                "content-length": "100",
            },
            body: '{"a":"x"}',
        });
        const res = makeRes();

        let threw = false;
        try {
            await mw(req, res);
        } catch {
            threw = true;
        }
        expect(threw).toBe(true);
        expect(res.statusCode).toBe(413);
    });

    test("prototype pollution stripped", async () => {
        const mw = json();
        const req = makeReq({
            headers: { "content-type": "application/json" },
            body: '{"__proto__":{"polluted":true},"name":"budi"}',
        });
        const res = makeRes();
        await mw(req, res);
        expect(req.body.name).toBe("budi");
        expect(req.body.polluted).toBe(undefined);
        expect({}.polluted).toBe(undefined);
    });
});

test("chunk over limit returns 413", async () => {
    const mw = json({ limit: 5 });
    const req = makeReq({
        headers: { "content-type": "application/json" },
        body: '{"a":"1234567890"}', // > 5 byte
    });
    const res = makeRes();
    let threw = false;
    try {
        await mw(req, res);
    } catch {
        threw = true;
    }
    expect(threw).toBe(true);
    expect(res.statusCode).toBe(413);
});
