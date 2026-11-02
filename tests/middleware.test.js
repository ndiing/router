require("../src/polyfill");
const { App } = require("../src/app");
const { Router } = require("../src/router");
const { Request } = require("../src/request");
const { parseQueryString } = require("../src/request");

/* =========================================================
 * Helper: mock req/res untuk middleware
 * =======================================================*/
function mockReq(method, url, { headers = {}, body = null } = {}) {
    const req = Object.create(Request.prototype);
    req.method = method;
    req.url = url;
    req.headers = headers;
    req.params = {};
    // stream async iterable
    req[Symbol.asyncIterator] = async function* () {
        if (body !== null) {
            const chunks = Array.isArray(body) ? body : [Buffer.from(body)];
            for (const c of chunks) yield Buffer.isBuffer(c) ? c : Buffer.from(c);
        }
    };
    return req;
}

function mockRes() {
    return {
        done: false,
        statusCode: 200,
        headers: {},
        body: "",
        status(c) {
            this.statusCode = c;
            return this;
        },
        setHeader(k, v) {
            this.headers[k.toLowerCase()] = v;
            return this;
        },
        getHeader(k) {
            return this.headers[k.toLowerCase()];
        },
        appendHeader(k, v) {
            const cur = this.getHeader(k);
            if (cur === undefined) this.setHeader(k, v);
            else if (Array.isArray(cur)) this.setHeader(k, [...cur, v]);
            else this.setHeader(k, [cur, v]);
            return this;
        },
        json(v) {
            this.setHeader("content-type", "application/json");
            this.end(JSON.stringify(v));
        },
        send(c) {
            this.end(c);
        },
        end(c) {
            this.done = true;
            if (c !== undefined) this.body += c;
        },
        write(c) {
            this.body += c;
        },
    };
}

/* =========================================================
 * json()
 * =======================================================*/
describe("middleware json", () => {
    test("parse JSON body", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json", "content-length": "13" },
            body: '{"name":"John"}',
        });
        const res = mockRes();
        await App.json()(req, res);
        expect(req.body).toEqual({ name: "John" });
        expect(res.done).toBe(false);
    });

    test("skip kalau method bukan POST/PUT/PATCH/QUERY", async () => {
        const req = mockReq("GET", "/", {
            headers: { "content-type": "application/json" },
            body: '{"a":1}',
        });
        const res = mockRes();
        await App.json()(req, res);
        expect(req.body).toBe(undefined);
    });

    test("skip kalau content-type bukan JSON", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "text/plain" },
            body: '{"a":1}',
        });
        const res = mockRes();
        await App.json()(req, res);
        expect(req.body).toBe(undefined);
    });

    test("body kosong -> req.body = null", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json" },
            body: null,
        });
        const res = mockRes();
        await App.json()(req, res);
        expect(req.body).toBe(null);
    });

    test("JSON invalid -> throw 400", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json", "content-length": "3" },
            body: "{x}",
        });
        const res = mockRes();

        // await expect(App.json()(req, res)).rejects.toThrow("Bad Request");
        try {
            await App.json()(req, res);
        } catch (error) {
            expect(error.message).toContain("Bad Request");
        }
        expect(res.statusCode).toBe(400);
    });

    test("content-length > limit -> throw 413", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json", "content-length": "999999" },
            body: '{"a":1}',
        });
        const res = mockRes();
        // await expect(App.json({ limit: 100 })(req, res))
        // .rejects.toThrow("Payload Too Large");
        try {
            await App.json({ limit: 100 })(req, res);
        } catch (error) {
            expect(error.message).toContain("Payload Too Large");
        }
        expect(res.statusCode).toBe(413);
    });

    test("chunk length > limit -> throw 413", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json" },
            body: '{"aaaaaaaaaaaaaaaaaaaaaaaaaaaaa":1}',
        });
        const res = mockRes();
        // await expect(App.json({ limit: 10 })(req, res)).rejects.toThrow("Payload Too Large");
        try {
            await App.json({ limit: 10 })(req, res);
        } catch (error) {
            expect(error.message).toContain("Payload Too Large");
        }
        expect(res.statusCode).toBe(413);
    });

    test("reviver blokir __proto__", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json" },
            body: '{"__proto__":{"polluted":true},"a":1}',
        });
        const res = mockRes();
        await App.json()(req, res);
        expect(req.body.a).toBe(1);
        expect(req.body.__proto__).toBe(Object.prototype); // nggak ke-pollute
    });

    test("skip kalau req.body sudah ada (anti double parse)", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json" },
            body: '{"a":1}',
        });
        req.body = { existing: true };
        const res = mockRes();
        await App.json()(req, res);
        expect(req.body).toEqual({ existing: true }); // nggak di-nimpa
    });
});

describe("middleware urlencoded", () => {
    test("parse urlencoded body", async () => {
        const req = mockReq("POST", "/", {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "content-length": "11",
            },
            body: "a=1&b=2&b=3",
        });
        const res = mockRes();
        await App.urlencoded()(req, res);
        expect(req.body).toEqual({ a: "1", b: ["2", "3"] });
    });

    test("skip kalau method bukan POST/PUT/PATCH/QUERY", async () => {
        const req = mockReq("GET", "/", {
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "a=1",
        });
        const res = mockRes();
        await App.urlencoded()(req, res);
        expect(req.body).toBe(undefined);
    });

    test("skip kalau content-type bukan urlencoded", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json" },
            body: "a=1",
        });
        const res = mockRes();
        await App.urlencoded()(req, res);
        expect(req.body).toBe(undefined);
    });

    test("body kosong -> req.body = null", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: null,
        });
        const res = mockRes();
        await App.urlencoded()(req, res);
        expect(req.body).toBe(null);
    });

    test("content-length > limit -> throw 413", async () => {
        const req = mockReq("POST", "/", {
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "content-length": "999999",
            },
            body: "a=1",
        });
        const res = mockRes();
        // await expect(App.urlencoded({ limit: 10 })(req, res)).rejects.toThrow("Payload Too Large");
        try {
            await App.urlencoded({ limit: 10 })(req, res);
        } catch (error) {
            expect(error.message).toContain("Payload Too Large");
        }
        expect(res.statusCode).toBe(413);
    });

    test("chunk length > limit -> throw 413", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "aaaaaaaaaaaaaaaaaaaa=1",
        });
        const res = mockRes();
        // await expect(App.urlencoded({ limit: 10 })(req, res)).rejects.toThrow("Payload Too Large");
        try {
            await App.urlencoded({ limit: 10 })(req, res);
        } catch (error) {
            expect(error.message).toContain("Payload Too Large");
        }
        expect(res.statusCode).toBe(413);
    });

    test("skip kalau req.body sudah ada (anti double parse)", async () => {
        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "a=1",
        });
        req.body = { existing: true };
        const res = mockRes();
        await App.urlencoded()(req, res);
        expect(req.body).toEqual({ existing: true });
    });
});

describe("middleware cors", () => {
    test("default: Allow-Origin *", () => {
        const req = mockReq("GET", "/", { headers: { origin: "http://example.com" } });
        const res = mockRes();
        App.cors()(req, res);
        expect(res.headers["access-control-allow-origin"]).toBe("*");
        expect(res.done).toBe(false);
    });

    test("credentials: true -> echo origin + Vary", () => {
        const req = mockReq("GET", "/", { headers: { origin: "http://example.com" } });
        const res = mockRes();
        App.cors({ credentials: true })(req, res);
        expect(res.headers["access-control-allow-origin"]).toBe("http://example.com");
        expect(res.headers["access-control-allow-credentials"]).toBe("true");
        expect(res.headers["vary"]).toContain("Origin");
    });

    test("origin array -> echo kalau cocok", () => {
        const req = mockReq("GET", "/", { headers: { origin: "http://b.com" } });
        const res = mockRes();
        App.cors({ origin: ["http://a.com", "http://b.com"] })(req, res);
        expect(res.headers["access-control-allow-origin"]).toBe("http://b.com");
    });

    test("origin array -> no header kalau nggak cocok", () => {
        const req = mockReq("GET", "/", { headers: { origin: "http://c.com" } });
        const res = mockRes();
        App.cors({ origin: ["http://a.com", "http://b.com"] })(req, res);
        expect(res.headers["access-control-allow-origin"]).toBe(undefined);
    });

    test("expose headers", () => {
        const req = mockReq("GET", "/", { headers: { origin: "http://a.com" } });
        const res = mockRes();
        App.cors({ headers: ["X-Foo", "X-Bar"] })(req, res);
        expect(res.headers["access-control-expose-headers"]).toEqual(["x-foo", "x-bar"]);
    });

    test("preflight OPTIONS -> 204 + headers", () => {
        const req = mockReq("OPTIONS", "/", {
            headers: {
                origin: "http://a.com",
                "access-control-request-method": "POST",
                "access-control-request-headers": "content-type, authorization",
            },
        });
        const res = mockRes();
        App.cors({ headers: ["content-type", "authorization"], methods: ["GET", "POST"], maxAge: 600 })(req, res);
        expect(res.statusCode).toBe(204);
        expect(res.headers["access-control-allow-origin"]).toBe("*");
        expect(res.headers["access-control-allow-methods"]).toEqual(["GET", "POST"]);
        expect(res.headers["access-control-allow-headers"]).toEqual(["content-type", "authorization"]);
        expect(res.headers["access-control-max-age"]).toBe(600);
        expect(res.done).toBe(true);
    });

    test("preflight method tidak diizinkan -> no Allow-Methods", () => {
        const req = mockReq("OPTIONS", "/", {
            headers: {
                origin: "http://a.com",
                "access-control-request-method": "DELETE",
            },
        });
        const res = mockRes();
        App.cors({ methods: ["GET", "POST"] })(req, res);
        expect(res.headers["access-control-allow-methods"]).toBe(undefined);
    });

    test("headers: '*' tanpa credentials -> Allow-Headers *", () => {
        const req = mockReq("OPTIONS", "/", {
            headers: {
                origin: "http://a.com",
                "access-control-request-method": "POST",
                "access-control-request-headers": "x-custom",
            },
        });
        const res = mockRes();
        App.cors({ headers: "*" })(req, res);
        expect(res.headers["access-control-allow-headers"]).toBe("*");
    });
});

test("headers tidak di-set -> echo requested (line 60-61)", () => {
    const req = mockReq("OPTIONS", "/", {
        headers: {
            origin: "http://a.com",
            "access-control-request-method": "POST",
            "access-control-request-headers": "x-custom, x-other",
        },
    });
    const res = mockRes();
    // headers TIDAK di-set -> else branch -> value = requested
    App.cors()(req, res);
    expect(res.headers["access-control-allow-headers"]).toEqual(["x-custom", "x-other"]);
});

test("methods '*' tanpa credentials -> Allow-Methods * (line 71)", () => {
    const req = mockReq("OPTIONS", "/", {
        headers: {
            origin: "http://a.com",
            "access-control-request-method": "POST",
        },
    });
    const res = mockRes();
    App.cors({ methods: "*" })(req, res);
    expect(res.headers["access-control-allow-methods"]).toBe("*");
});

test("expose headers '*' tanpa credentials -> Expose-Headers * (line 83)", () => {
    const req = mockReq("GET", "/", { headers: { origin: "http://a.com" } });
    const res = mockRes();
    App.cors({ headers: "*" })(req, res);
    expect(res.headers["access-control-expose-headers"]).toBe("*");
});
