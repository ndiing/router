require("../src/polyfill");
const http = require("node:http");
const { App } = require("../src/app");

function request(server, { method = "GET", path = "/", headers = {}, body } = {}) {
    const { port } = server.address();
    return new Promise((resolve, reject) => {
        const req = http.request({ host: "127.0.0.1", port, method, path, headers }, (res) => {
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () =>
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: Buffer.concat(chunks).toString(),
                }),
            );
        });
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
    });
}

function listen(app) {
    return new Promise((resolve) => {
        const server = app.listen(0, () => resolve(server));
    });
}

function close(server) {
    return new Promise((resolve) => server.close(resolve));
}

describe("App - basic routing", () => {
    let server;
    beforeAll(async () => {
        const app = new App();
        app.get("/hello", (req, res) => res.send("world"));
        app.get("/json", (req, res) => res.json({ a: 1 }));
        app.get("/user/:id", (req, res) => res.json({ id: req.params.id }));
        server = await listen(app);
    });
    afterAll(async () => {
        if (server) await close(server);
    });

    test("returns 200 and body", async () => {
        const res = await request(server, { path: "/hello" });
        expect(res.status).toBe(200);
        expect(res.body).toBe("world");
    });
    test("json response", async () => {
        const res = await request(server, { path: "/json" });
        expect(res.headers["content-type"]).toContain("application/json");
        expect(JSON.parse(res.body)).toEqual({ a: 1 });
    });
    test("params", async () => {
        const res = await request(server, { path: "/user/42" });
        expect(JSON.parse(res.body)).toEqual({ id: "42" });
    });
});

describe("App - 404 fallback", () => {
    let server;
    beforeAll(async () => {
        server = await listen(new App());
    });
    afterAll(async () => {
        if (server) await close(server);
    });
    test("unknown route -> 404 json", async () => {
        const res = await request(server, { path: "/nope" });
        expect(res.status).toBe(404);
        const parsed = JSON.parse(res.body);
        expect(parsed.error.message !== undefined).toBe(true);
    });
});

describe("App - error handling", () => {
    let server;
    beforeAll(async () => {
        const app = new App();
        app.get("/boom", () => {
            throw new Error("kaboom");
        });
        app.get("/async-boom", async () => {
            throw new Error("async kaboom");
        });
        app.use("/catch", (err, req, res) => {
            res.status(418).json({ caught: err.message });
        });
        app.get("/catch/boom", () => {
            throw new Error("caught it");
        });
        server = await listen(app);
    });
    afterAll(async () => {
        if (server) await close(server);
    });

    test("sync throw -> 500", async () => {
        const res = await request(server, { path: "/boom" });
        expect(res.status).toBe(500);
        expect(JSON.parse(res.body).error.message).toBe("kaboom");
    });
    test("async throw -> 500", async () => {
        const res = await request(server, { path: "/async-boom" });
        expect(res.status).toBe(500);
        expect(JSON.parse(res.body).error.message).toBe("async kaboom");
    });
    test("error handler catches", async () => {
        const res = await request(server, { path: "/catch/boom" });
        expect(res.status).toBe(418);
        expect(JSON.parse(res.body)).toEqual({ caught: "caught it" });
    });
});

describe("App - timeout", () => {
    let server;
    beforeAll(async () => {
        const app = new App({ requestTimeout: 100 });
        app.get("/slow", async (req, res) => {
            await new Promise((r) => setTimeout(r, 300));
            res.send("late");
        });
        server = await listen(app);
    });
    afterAll(async () => {
        if (server) await close(server);
    });
    test("times out with 504", async () => {
        const res = await request(server, { path: "/slow" });
        expect(res.status).toBe(504);
    });
});

describe("App - middleware integration", () => {
    let server;
    beforeAll(async () => {
        const app = new App();
        app.use(App.json());
        app.post("/echo", (req, res) => res.json(req.body));
        server = await listen(app);
    });
    afterAll(async () => {
        if (server) await close(server);
    });

    test("parses json body", async () => {
        const res = await request(server, {
            method: "POST",
            path: "/echo",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ hi: "there" }),
        });
        expect(JSON.parse(res.body)).toEqual({ hi: "there" });
    });
    test("413 on oversized body", async () => {
        const res = await request(server, {
            method: "POST",
            path: "/echo",
            headers: { "content-type": "application/json", "content-length": "999999" },
            body: "x",
        });
        expect(res.status).toBe(413);
    });
});
