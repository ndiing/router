const { urlencoded } = require("../src/middleware/urlencoded");

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
        setHeader() {},
    };
}

describe("middleware/urlencoded", () => {
    test("skips GET", async () => {
        const mw = urlencoded();
        const req = makeReq({ method: "GET" });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toBe(undefined);
    });

    test("skips wrong content-type", async () => {
        const mw = urlencoded();
        const req = makeReq({
            headers: { "content-type": "application/json" },
            body: "a=1",
        });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toBe(undefined);
    });

    test("parses form body", async () => {
        const mw = urlencoded();
        const req = makeReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "name=budi&age=20",
        });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toEqual({ name: "budi", age: "20" });
    });

    test("repeated keys become array", async () => {
        const mw = urlencoded();
        const req = makeReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "tag=a&tag=b",
        });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toEqual({ tag: ["a", "b"] });
    });

    test("empty body sets null", async () => {
        const mw = urlencoded();
        const req = makeReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
        });
        const res = makeRes();
        await mw(req, res);
        expect(req.body).toBe(null);
    });
});

test("content-length over limit returns 413", async () => {
    const mw = urlencoded({ limit: 10 });
    const req = makeReq({
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "content-length": "100",
        },
        body: "a=1",
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

test("chunk over limit returns 413", async () => {
    const mw = urlencoded({ limit: 5 });
    const req = makeReq({
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "a=1234567890", // 12 byte > 5
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
