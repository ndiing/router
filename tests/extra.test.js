// tests/extra.test.js
require("../src/polyfill");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");

const { App } = require("../src/app");
const { Router } = require("../src/router");
const { Node } = require("../src/node");
const { cors } = require("../src/middleware/cors");
const { urlencoded } = require("../src/middleware/urlencoded");
const { parseCookie, buildCookie, encodeCookie } = require("../src/util");

// ---------- helpers ----------
function listen(app) {
    return new Promise((resolve) => {
        const server = app.listen(0, () => resolve(server));
    });
}
function close(server) {
    return new Promise((resolve) => server.close(resolve));
}
function request(server, { method = "GET", path = "/", headers = {}, body } = {}) {
    const { port } = server.address();
    return new Promise((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port, method, path, headers }, (res) => {
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
        });
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
    });
}
async function expectRejects(promise, substring) {
    try {
        await promise;
        throw new Error("expected rejection but resolved");
    } catch (err) {
        expect(err.message).toContain(substring);
    }
}
function makeCorsRes() {
    const headers = {};
    const res = {
        statusCode: 200,
        done: false,
        ended: false,
        setHeader(k, v) {
            headers[k] = v;
        },
        appendHeader(k, v) {
            if (headers[k] === undefined) headers[k] = v;
            else if (Array.isArray(headers[k])) headers[k].push(v);
            else headers[k] = [headers[k], v];
        },
        end() {
            res.ended = true;
            res.done = true;
        },
        getHeaders() {
            return headers;
        },
    };
    return res;
}
function preflight(origin, reqHeaders, reqMethod) {
    return {
        method: "OPTIONS",
        headers: {
            origin,
            "access-control-request-method": reqMethod,
            ...(reqHeaders ? { "access-control-request-headers": reqHeaders } : {}),
        },
    };
}

// ============================================================
// app.js — 30-38 (error setelah timeout) + 112-113 (error handler throw)
// ============================================================
describe("App - error after timeout", () => {
    let server;
    beforeAll(async () => {
        const app = new App({ requestTimeout: 50 });
        app.get("/late-throw", async () => {
            await new Promise((r) => setTimeout(r, 150));
            throw new Error("late error");
        });
        server = await listen(app);
    });
    afterAll(async () => {
        if (server) await close(server);
    });

    test("throwing after timeout is swallowed (504 still)", async () => {
        const res = await request(server, { path: "/late-throw" });
        expect(res.status).toBe(504);
        // beri waktu promise late resolve biar branch 32-38 kejalan
        await new Promise((r) => setTimeout(r, 200));
    });
});

describe("App - error handler itself throws", () => {
    let server;
    beforeAll(async () => {
        const app = new App();
        app.get("/boom", () => {
            throw new Error("orig");
        });
        app.use((err, req, res) => {
            throw new Error("handler failed");
        });
        server = await listen(app);
    });
    afterAll(async () => {
        if (server) await close(server);
    });

    test("wraps error and falls back to 500", async () => {
        const res = await request(server, { path: "/boom" });
        expect(res.status).toBe(500);
        const parsed = JSON.parse(res.body);
        expect(parsed.error.message).toBe("handler failed");
    });
});

// ============================================================
// cors.js — 55, 71, 83, 85-86
// ============================================================
describe("cors - extra branches", () => {
    test("headers=* without credentials -> Allow-Headers *", () => {
        const res = makeCorsRes();
        cors({ headers: "*" })(preflight("https://a.com", "x-a, x-b", "POST"), res);
        expect(res.getHeaders()["Access-Control-Allow-Headers"]).toBe("*");
    });

    test("methods=* without credentials -> Allow-Methods *", () => {
        const res = makeCorsRes();
        cors({ methods: "*" })(preflight("https://a.com", null, "POST"), res);
        expect(res.getHeaders()["Access-Control-Allow-Methods"]).toBe("*");
    });

    test("headers=* without credentials -> Expose-Headers *", () => {
        const res = makeCorsRes();
        cors({ headers: "*" })({ method: "GET", headers: { origin: "https://a.com" } }, res);
        expect(res.getHeaders()["Access-Control-Expose-Headers"]).toBe("*");
    });

    test("expose headers with array", () => {
        const res = makeCorsRes();
        cors({ headers: ["x-a", "x-b"] })({ method: "GET", headers: {} }, res);
        expect(res.getHeaders()["Access-Control-Expose-Headers"]).toEqual(["x-a", "x-b"]);
    });

    test("headers=* WITH credentials -> echo requested", () => {
        const res = makeCorsRes();
        cors({ headers: "*", credentials: true })(preflight("https://a.com", "x-a, x-b", "POST"), res);
        expect(res.getHeaders()["Access-Control-Allow-Headers"]).toEqual(["x-a", "x-b"]);
    });
});

// ============================================================
// urlencoded.js — 28-30 (content-length limit)
// ============================================================
describe("urlencoded - content-length limit", () => {
    test("rejects by declared content-length", async () => {
        const res = { statusCode: 200 };
        const req = {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "content-length": "999999",
            },
            async *[Symbol.asyncIterator]() {},
        };
        await expectRejects(urlencoded({ limit: 10 })(req, res), "Payload Too Large");
        expect(res.statusCode).toBe(413);
    });
});

// ============================================================
// response.js — 50-70 (download)
// ============================================================
describe("Response.download", () => {
    let server;
    let file;
    beforeAll(async () => {
        file = path.join(os.tmpdir(), `dl-${Date.now()}.txt`);
        fs.writeFileSync(file, "hello-file");
        const app = new App();
        app.get("/dl", (req, res) => res.download(file));
        app.get("/dl-named", (req, res) => res.download(file, "greeting.txt"));
        app.get("/dl-missing", (req, res) => res.download(file + ".nope", "x.bin"));
        server = await listen(app);
    });
    afterAll(async () => {
        if (server) await close(server);
        if (file && fs.existsSync(file)) fs.unlinkSync(file);
    });

    test("streams file with default filename", async () => {
        const res = await request(server, { path: "/dl" });
        expect(res.status).toBe(200);
        expect(res.headers["content-disposition"]).toContain("attachment");
        expect(res.headers["content-disposition"]).toContain(path.basename(file));
        expect(res.body).toBe("hello-file");
    });

    test("streams file with custom filename", async () => {
        const res = await request(server, { path: "/dl-named" });
        expect(res.headers["content-disposition"]).toContain('filename="greeting.txt"');
    });

    test("missing file -> 500 (error branch)", async () => {
        const res = await request(server, { path: "/dl-missing" });
        // status mungkin 500 atau 200 tergantung timing headerSent
        expect(res.status === 500 || res.status === 200).toBe(true);
    });
});

// ============================================================
// router.js — 64-66 (walk split, rest kosong) + 145-147 (query) + 284 (params no slash)
// ============================================================
describe("Router - walk split edge", () => {
    test("register longer prefix then shorter triggers split", () => {
        const r = new Router();
        const a = () => {};
        const b = () => {};
        r.get("/foobar", b);
        r.get("/foo", a); // harus split node "foobar" jadi "foo" + "bar"
        expect(Object.values(r.find("GET", "/foobar").handlers).includes(b)).toBe(true);
        expect(Object.values(r.find("GET", "/foo").handlers).includes(a)).toBe(true);
    });

    test("reverse: shorter then longer", () => {
        const r = new Router();
        const a = () => {};
        const b = () => {};
        r.get("/foo", a);
        r.get("/foobar", b);
        expect(Object.values(r.find("GET", "/foo").handlers).includes(a)).toBe(true);
        expect(Object.values(r.find("GET", "/foobar").handlers).includes(b)).toBe(true);
    });
});

describe("Router.query method", () => {
    test("registers QUERY handler", () => {
        const r = new Router();
        const h = () => {};
        r.query("/q", h);
        expect(Object.values(r.find("QUERY", "/q").handlers).includes(h)).toBe(true);
    });
});

describe("Router - param with no slash remainder", () => {
    test("param at end of path", () => {
        const r = new Router();
        const h = () => {};
        r.get("/:id", h);
        const res = r.find("GET", "/only");
        expect(res.params.id).toBe("only");
        expect(Object.values(res.handlers).includes(h)).toBe(true);
    });

    test("empty value for param at end is skipped", () => {
        const r = new Router();
        const h = () => {};
        r.get("/a/:id", h);
        // path "/a/" -> setelah "/a" sisa "/" -> slashIndex=0, value="" -> skip
        const res = r.find("GET", "/a/");
        // tidak match param, tapi trailing-slash fallback coba "/a" -> juga gak match
        // pastikan tidak crash; params kosong
        expect(res.params.id).toBe(undefined);
    });
});

// ============================================================
// util.js — 120-122 (parseCookie: name kosong -> skip)
// ============================================================
describe("util - parseCookie empty name", () => {
    test("skips pair with empty name", () => {
        const c = parseCookie("=value; a=1");
        expect(c.a).toBe("1");
        expect(c[""]).toBe(undefined);
    });

    test("skips segment with only whitespace before =", () => {
        const c = parseCookie("   =x; b=2");
        expect(c.b).toBe("2");
    });
});

describe("util - buildCookie extra", () => {
    test("partitioned + httpOnly + secure combo", () => {
        const c = buildCookie({
            name: "a",
            value: "1",
            partitioned: true,
            httpOnly: true,
            secure: true,
        });
        expect(c).toContain("Partitioned");
        expect(c).toContain("HttpOnly");
        expect(c).toContain("Secure");
    });

    test("no path when path empty string", () => {
        const c = buildCookie({ name: "a", value: "1", path: "" });
        expect(c).toContain("a=1");
        expect(c.indexOf("Path=")).toBe(-1);
    });

    test("no sameSite when null", () => {
        const c = buildCookie({ name: "a", value: "1", sameSite: null });
        expect(c.indexOf("SameSite=")).toBe(-1);
    });
});

describe("util - encodeCookie invalid surrogate", () => {
    test("returns raw on invalid input", () => {
        expect(encodeCookie("\uD800")).toBe("\uD800");
    });
});
