const http = require("http");
const { urlencoded } = require("../src/middleware/urlencoded");

// Helper: bikin mock req (async iterable) + mock res
function createReq({ method = "POST", headers = {}, body = "" } = {}) {
    const chunks = body === "" ? [] : [Buffer.from(body, "utf8")];
    const req = {
        method,
        headers,
    };
    req[Symbol.asyncIterator] = async function* () {
        for (const chunk of chunks) yield chunk;
    };
    return req;
}

function createRes() {
    const res = {
        statusCode: 200,
        headers: {},
        writableEnded: false,
        setHeader(k, v) {
            this.headers[k] = v;
        },
        end() {
            this.writableEnded = true;
        },
    };
    return res;
}

function toNativeObject(obj) {
    return JSON.parse(JSON.stringify(obj));
}

describe("urlencoded middleware", () => {
    // === method yang tidak relevan ===
    test("skip untuk GET", async () => {
        const req = createReq({ method: "GET" });
        const res = createRes();
        await urlencoded()(req, res);
        expect(req.body).toBe(undefined);
    });

    test("skip untuk DELETE", async () => {
        const req = createReq({ method: "DELETE" });
        const res = createRes();
        await urlencoded()(req, res);
        expect(req.body).toBe(undefined);
    });

    // === content-type ===
    test("skip kalau tanpa content-type", async () => {
        const req = createReq({ body: "a=1" });
        const res = createRes();
        await urlencoded()(req, res);
        expect(req.body).toBe(undefined);
    });

    test("skip kalau content-type bukan urlencoded", async () => {
        const req = createReq({
            headers: { "content-type": "application/json" },
            body: "a=1",
        });
        const res = createRes();
        await urlencoded()(req, res);
        expect(req.body).toBe(undefined);
    });

    test("parse kalau content-type urlencoded", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "name=John&age=30",
        });
        const res = createRes();
        await urlencoded()(req, res);
        expect(toNativeObject(req.body)).toEqual({ name: "John", age: "30" });
    });

    test("parse kalau content-type urlencoded + charset", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded; charset=utf-8" },
            body: "a=1",
        });
        const res = createRes();
        await urlencoded()(req, res);
        expect(toNativeObject(req.body)).toEqual({ a: "1" });
    });

    // === body kosong ===
    test("body kosong → null", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "",
        });
        const res = createRes();
        await urlencoded()(req, res);
        expect(req.body).toBe(null);
    });

    // === decoding ===
    test("decode + jadi spasi", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "name=hello+world",
        });
        const res = createRes();
        await urlencoded()(req, res);
        expect(toNativeObject(req.body)).toEqual({ name: "hello world" });
    });

    test("decode %20 jadi spasi", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "name=hello%20world",
        });
        const res = createRes();
        await urlencoded()(req, res);
        expect(toNativeObject(req.body)).toEqual({ name: "hello world" });
    });

    test("duplikat key jadi array", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "a=1&a=2&a=3",
        });
        const res = createRes();
        await urlencoded()(req, res);
        expect(toNativeObject(req.body)).toEqual({ a: ["1", "2", "3"] });
    });

    test("nilai dengan = di dalam", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "token=abc=def",
        });
        const res = createRes();
        await urlencoded()(req, res);
        expect(toNativeObject(req.body)).toEqual({ token: "abc=def" });
    });

    // === limit ===
    test("tolak kalau content-length > limit", async () => {
        const req = createReq({
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "content-length": "999",
            },
            body: "a=1",
        });
        const res = createRes();
        let err;
        try {
            await urlencoded({ limit: 10 })(req, res);
        } catch (e) {
            err = e;
        }
        // expect(err).toBeTruthy();
        expect(res.statusCode).toBe(413);
    });

    test("tolak kalau chunkLength > limit (streaming)", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "a=" + "x".repeat(100),
        });
        const res = createRes();
        let err;
        try {
            await urlencoded({ limit: 10 })(req, res);
        } catch (e) {
            err = e;
        }
        // expect(err).toBeTruthy();
        expect(res.statusCode).toBe(413);
    });

    test("terima kalau di bawah limit", async () => {
        const req = createReq({
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "a=1",
        });
        const res = createRes();
        await urlencoded({ limit: 100 })(req, res);
        expect(toNativeObject(req.body)).toEqual({ a: "1" });
    });

    // === error message ===
    test("error message pakai STATUS_CODES[413]", async () => {
        const req = createReq({
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "content-length": "999",
            },
            body: "a=1",
        });
        const res = createRes();
        let err;
        try {
            await urlencoded({ limit: 10 })(req, res);
        } catch (e) {
            err = e;
        }
        expect(err.message).toBe(http.STATUS_CODES[413]);
    });
});
