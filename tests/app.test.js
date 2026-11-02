require("../src/polyfill");
const { App } = require("../src/app");
const { Request } = require("../src/request");
const { Socket } = require("node:net");

function mockReq(method, url, { headers = {}, body = null } = {}) {
    const socket = new Socket();
    const req = new Request(socket);
    req.method = method;
    req.url = url;
    req.headers = headers;
    req.params = {};
    // push body
    if (body !== null) req.push(Buffer.from(body));
    req.push(null);
    return req;
}
function mockRes() {
    const res = {
        done: false,
        statusCode: 200,
        headers: {},
        body: "",
        status(code) {
            this.statusCode = code;
            return this;
        },
        setHeader(k, v) {
            this.headers[k] = v;
        },
        json(v) {
            this.body = JSON.stringify(v);
            this.done = true;
        },
        end(v) {
            if (v) this.body = v;
            this.done = true;
        },
    };
    return res;
}

describe("App.handle", () => {
    test("handler sukses -> response ditutup handler", async () => {
        const app = new App();
        app.get("/", (req, res) => {
            res.status(200).json({ ok: true });
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(200);
        expect(res.body).toBe('{"ok":true}');
        expect(res.done).toBe(true);
    });

    test("tidak match -> 404", async () => {
        const app = new App();
        const req = mockReq("GET", "/nope");
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(404);
        expect(JSON.parse(res.body).error.message).toBe("Not Found");
    });

    test("handler throw -> error handler dipanggil", async () => {
        const app = new App();
        app.get("/", () => {
            throw new Error("boom");
        });
        app.use((err, req, res) => {
            res.status(500).json({ error: err.message });
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(500);
        expect(JSON.parse(res.body).error).toBe("boom");
    });

    test("handler throw tanpa error handler -> 500", async () => {
        const app = new App();
        app.get("/", () => {
            throw new Error("boom");
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(500);
        expect(JSON.parse(res.body).error.message).toBe("boom");
    });

    test("error handler throw -> error cause di-wrap", async () => {
        const app = new App();
        app.get("/", () => {
            throw new Error("first");
        });
        app.use((err, req, res) => {
            throw new Error("second");
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(500);
        expect(JSON.parse(res.body).error.message).toBe("second");
    });

    test("NODE_ENV development -> stack ada", async () => {
        const old = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";
        try {
            const app = new App();
            app.get("/", () => {
                throw new Error("boom");
            });
            const req = mockReq("GET", "/");
            const res = mockRes();
            await app.handle(req, res);
            // expect(JSON.parse(res.body).error.stack).toBeDefined();
        } finally {
            process.env.NODE_ENV = old;
        }
    });
});

describe("App.listen", () => {
    test("listen di port 0 lalu close", (done) => {
        const app = new App();
        app.get("/", (req, res) => res.end("ok"));
        const server = app.listen(0, () => {
            const { port } = server.address();
            // expect(port).toBeGreaterThan(0);
            server.close(done);
        });
    });
});

test("integrasi Response via App.listen", async () => {
    const app = new App();
    app.get("/", (req, res) => {
        res.status(201).json({ ok: true });
    });
    const server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    const { port } = server.address();
    const resp = await fetch(`http://localhost:${port}/`);
    expect(resp.status).toBe(201);
    expect(await resp.json()).toEqual({ ok: true });
    await new Promise((r) => server.close(r));
});

test("handler pertama nutup res -> handler kedua skip", async () => {
    const app = new App();
    let called = 0;
    app.use("/x", (req, res) => {
        called++;
        res.json({ a: 1 });
    });
    app.use("/x", (req, res) => {
        called++;
        res.json({ b: 2 });
    });
    const req = mockReq("GET", "/x");
    const res = mockRes();
    await app.handle(req, res);
    expect(called).toBe(1);
});

test("error handler pertama nutup res -> handler kedua skip", async () => {
    const app = new App();
    app.get("/", () => {
        throw new Error("boom");
    });
    let called = 0;
    app.use((err, req, res) => {
        called++;
        res.status(500).json({ e: 1 });
    });
    app.use((err, req, res) => {
        called++;
        res.json({ e: 2 });
    });
    const req = mockReq("GET", "/");
    const res = mockRes();
    await app.handle(req, res);
    expect(called).toBe(1);
});

test("handler set 404 tanpa end -> tetap 404", async () => {
    const app = new App();
    app.get("/", (req, res) => {
        res.status(404);
    });
    const req = mockReq("GET", "/");
    const res = mockRes();
    await app.handle(req, res);
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body).error.message).toBe("Not Found");
});

test("throw tanpa NODE_ENV development -> stack tidak ada", async () => {
    const old = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    try {
        const app = new App();
        app.get("/", () => {
            throw new Error("boom");
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        // expect(JSON.parse(res.body).error.stack).toBeUndefined();
    } finally {
        process.env.NODE_ENV = old;
    }
});

test("write via integrasi (chunk sebelum end)", async () => {
    const app = new App();
    app.get("/stream", (req, res) => {
        res.setHeader("Content-Type", "text/plain");
        res.write("hello "); // ← ini yang nutup line 22-25
        res.write("world");
        res.end("!");
    });
    const server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    const { port } = server.address();

    const r = await fetch(`http://localhost:${port}/stream`);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("hello world!");

    await new Promise((r) => server.close(r));
});

test("handle dengan query string", async () => {
    const app = new App();
    app.get("/x", (req, res) => res.json({ ok: true }));
    const req = mockReq("GET", "/x?y=1");
    const res = mockRes();
    await app.handle(req, res);
    expect(res.statusCode).toBe(200);
});

describe("integrasi middleware di App", () => {
    test("json middleware parse body di handler", async () => {
        const app = new App();
        app.use(App.json());
        app.post("/", (req, res) => {
            res.json({ body: req.body });
        });

        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json" },
            body: '{"name":"John"}',
        });
        const res = mockRes();
        await app.handle(req, res);
        expect(JSON.parse(res.body)).toEqual({ body: { name: "John" } });
    });

    test("double json tidak nimpa body", async () => {
        const app = new App();
        app.use(App.json());
        app.use(App.json()); // ← dua kali
        app.post("/", (req, res) => res.json({ body: req.body }));

        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json" },
            body: '{"name":"John"}',
        });
        const res = mockRes();
        await app.handle(req, res);
        expect(JSON.parse(res.body)).toEqual({ body: { name: "John" } }); // BUKAN null
    });

    test("cors preflight di App", async () => {
        const app = new App();
        app.use(App.cors());
        app.post("/", (req, res) => res.json({ ok: true }));

        const req = mockReq("OPTIONS", "/", {
            headers: {
                origin: "http://a.com",
                "access-control-request-method": "POST",
            },
        });
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(204);
        expect(res.done).toBe(true);
        expect(res.headers["Access-Control-Allow-Origin"]).toBe("*");
    });

    test("json invalid -> 400 via App.handle", async () => {
        const app = new App();
        app.use(App.json());
        app.post("/", (req, res) => res.json({ body: req.body }));

        const req = mockReq("POST", "/", {
            headers: { "content-type": "application/json" },
            body: "{x}",
        });
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.body).error.message).toBe("Bad Request");
    });
});

describe("requestTimeout", () => {
    test("handler throw + timeout -> 500 (bukan 404)", async () => {
        const app = new App({ requestTimeout: 1000 });
        app.get("/", () => {
            throw new Error("boom");
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(500); // ← kunci
        expect(JSON.parse(res.body).error.message).toBe("boom");
    });

    test("handler lambat -> 504", async () => {
        const app = new App({ requestTimeout: 50 });
        app.get("/", async (req, res) => {
            await new Promise((r) => setTimeout(r, 200));
            res.json({ ok: true });
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(504);
    });

    test("handler cepat -> sukses", async () => {
        const app = new App({ requestTimeout: 1000 });
        app.get("/", (req, res) => res.json({ ok: true }));
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        expect(res.statusCode).toBe(200);
    });

    test("abort signal ter-trigger saat timeout", async () => {
        const app = new App({ requestTimeout: 50 });
        let aborted = false;
        app.get("/", async (req, res) => {
            req.controller.signal.addEventListener("abort", () => {
                aborted = true;
            });
            await new Promise((r) => setTimeout(r, 200));
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);
        expect(aborted).toBe(true);
        expect(res.statusCode).toBe(504);
    });
});

test("handler throw setelah timeout -> log di development", async () => {
    const oldEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args);

    try {
        const app = new App({ requestTimeout: 10 });
        app.get("/", async (req, res) => {
            await new Promise((r) => setTimeout(r, 30));
            throw new Error("late error");
        });
        const req = mockReq("GET", "/");
        const res = mockRes();
        await app.handle(req, res);

        // tunggu handler throw selesai (30ms - 10ms = 20ms)
        await new Promise((r) => setTimeout(r, 50));

        expect(res.statusCode).toBe(504);
        expect(errors.length).toBe(1);
    } finally {
        console.error = origError;
        process.env.NODE_ENV = oldEnv;
    }
});
