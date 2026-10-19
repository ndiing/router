const App = require("../src/index");

// helper: start server di random port, return { baseURL, close }
async function start(app) {
    const server = app.listen(0);
    // tunggu server ready
    await new Promise((resolve) => server.once("listening", resolve));
    const port = server.address().port;
    return {
        baseURL: `http://localhost:${port}`,
        close: () => new Promise((resolve) => server.close(resolve)),
    };
}

// helper: fetch dan return { status, body }
async function req(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let body = null;
    try {
        body = JSON.parse(text);
    } catch {
        body = text;
    }
    return { status: res.status, headers: res.headers, body };
}

describe("App", () => {
    describe("routing + handler", () => {
        test("GET / returns handler response", async () => {
            const app = new App();
            app.get("/", (req, res) => res.json({ ok: true }));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                expect(r.status).toBe(200);
                expect(r.body.ok).toBe(true);
            } finally {
                await close();
            }
        });

        test("GET /:id passes params", async () => {
            const app = new App();
            app.get("/:id", (req, res) => res.json({ id: req.params.id }));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/321");
                expect(r.body.id).toBe("321");
            } finally {
                await close();
            }
        });

        test("query string parsed", async () => {
            const app = new App();
            app.get("/", (req, res) => res.json(req.query));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/?user=name&pass=word");
                expect(r.body.user).toBe("name");
                expect(r.body.pass).toBe("word");
            } finally {
                await close();
            }
        });

        test("path getter strips query", async () => {
            const app = new App();
            app.get("/api", (req, res) => res.json({ path: req.path }));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/api?x=1");
                expect(r.body.path).toBe("/api");
            } finally {
                await close();
            }
        });
    });

    describe("method routing", () => {
        test("POST body parsed by json middleware", async () => {
            const app = new App();
            app.post("/", App.json(), (req, res) => res.json(req.body));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user: "name" }),
                });
                expect(r.body.user).toBe("name");
            } finally {
                await close();
            }
        });

        test("GET same path as POST", async () => {
            const app = new App();
            app.get("/", (req, res) => res.json({ method: "GET" }));
            app.post("/", (req, res) => res.json({ method: "POST" }));
            const { baseURL, close } = await start(app);
            try {
                const g = await req(baseURL + "/", { method: "GET" });
                const p = await req(baseURL + "/", { method: "POST" });
                expect(g.body.method).toBe("GET");
                expect(p.body.method).toBe("POST");
            } finally {
                await close();
            }
        });
    });

    describe("middleware", () => {
        test("middleware runs before handler", async () => {
            const app = new App();
            const order = [];
            app.use((req, res) => {
                order.push("mw");
            });
            app.get("/", (req, res) => {
                order.push("handler");
                res.json({ order });
            });
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                expect(r.body.order).toEqual(["mw", "handler"]);
            } finally {
                await close();
            }
        });

        test("middleware on subpath", async () => {
            const app = new App();
            app.use("/api", (req, res) => {
                req.hit = true;
            });
            app.get("/api/x", (req, res) => res.json({ hit: req.hit === true }));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/api/x");
                expect(r.body.hit).toBe(true);
            } finally {
                await close();
            }
        });
    });

    describe("nested router", () => {
        test("nested router routes", async () => {
            const users = new App.Router();
            users.get("/", (req, res) => res.json({ who: "users" }));

            const app = new App();
            app.use("/users", users);

            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/users");
                expect(r.body.who).toBe("users");
            } finally {
                await close();
            }
        });

        test("nested router with params", async () => {
            const users = new App.Router();
            users.get("/:id", (req, res) => res.json({ id: req.params.id }));

            const app = new App();
            app.use("/users", users);

            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/users/42");
                expect(r.body.id).toBe("42");
            } finally {
                await close();
            }
        });
    });

    describe("error handling", () => {
        test("404 when no route matches", async () => {
            const app = new App();
            app.get("/api", (req, res) => res.json({ ok: true }));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/unknown");
                expect(r.status).toBe(404);
                expect(r.body.error.message).toBe("Not Found");
            } finally {
                await close();
            }
        });

        test("500 when handler throws", async () => {
            const app = new App();
            app.get("/", () => {
                throw new Error("boom");
            });
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                expect(r.status).toBe(500);
                expect(r.body.error.message).toBe("boom");
            } finally {
                await close();
            }
        });

        test("error handler catches throw", async () => {
            const app = new App();
            app.get("/", () => {
                throw new Error("boom");
            });
            app.use((err, req, res) => {
                res.status(418).json({ caught: err.message });
            });
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                expect(r.status).toBe(418);
                expect(r.body.caught).toBe("boom");
            } finally {
                await close();
            }
        });

        test("error handler that throws falls back to 500", async () => {
            const app = new App();
            app.get("/", () => {
                throw new Error("boom");
            });
            app.use((err, req, res) => {
                throw new Error("handler also failed");
            });
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                expect(r.status).toBe(500);
                expect(r.body.error.message).toBe("handler also failed");
            } finally {
                await close();
            }
        });

        test("json middleware throws 400 on invalid body", async () => {
            const app = new App();
            app.post("/", App.json(), (req, res) => res.json(req.body));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "{not json}",
                });
                expect(r.status).toBe(400);
            } finally {
                await close();
            }
        });
    });

    describe("Response helpers", () => {
        test("res.status().json() chain", async () => {
            const app = new App();
            app.get("/", (req, res) => res.status(201).json({ created: true }));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                expect(r.status).toBe(201);
                expect(r.body.created).toBe(true);
            } finally {
                await close();
            }
        });

        test("res.send string", async () => {
            const app = new App();
            app.get("/", (req, res) => res.send("hello"));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                expect(r.status).toBe(200);
                expect(r.body).toBe("hello");
            } finally {
                await close();
            }
        });

        test("json sets content-type", async () => {
            const app = new App();
            app.get("/", (req, res) => res.json({ ok: true }));
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                expect(r.headers.get("content-type")).toContain("application/json");
            } finally {
                await close();
            }
        });
    });

    describe("params freeze", () => {
        test("empty params is frozen", async () => {
            const app = new App();
            app.get("/", (req, res) => {
                req.params.x = 1;
                res.json({ hasX: Object.hasOwn(req.params, "x") });
            });
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/");
                // assign ke frozen object tidak nempel
                expect(r.body.hasX).toBe(false);
            } finally {
                await close();
            }
        });

        test("non-empty params not frozen", async () => {
            const app = new App();
            app.get("/:id", (req, res) => {
                req.params.extra = "ok";
                res.json(req.params);
            });
            const { baseURL, close } = await start(app);
            try {
                const r = await req(baseURL + "/1");
                expect(r.body.id).toBe("1");
                expect(r.body.extra).toBe("ok");
            } finally {
                await close();
            }
        });
    });
});

test("QUERY with body", async () => {
    const app = new App();
    app.query("/search", App.json(), (req, res) => res.json({ got: req.body }));
    const { baseURL, close } = await start(app);
    try {
        const r = await req(baseURL + "/search", {
            method: "QUERY",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: "hello" }),
        });
        expect(r.body.got.q).toBe("hello");
    } finally {
        await close();
    }
});

test("error stack included in development", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
        const app = new App();
        app.get("/", () => {
            throw new Error("boom");
        });
        const { baseURL, close } = await start(app);
        try {
            const r = await req(baseURL + "/");
            expect(r.body.error.stack !== undefined).toBe(true);
        } finally {
            await close();
        }
    } finally {
        process.env.NODE_ENV = original;
    }
});
test("timeout returns 502", async () => {
    const app = new App({ requestTimeout: 1000 });
    app.get("/", async (req, res) => {
        // handler kooperatif: berhenti saat abort
        await new Promise((resolve, reject) => {
            const t = setTimeout(resolve, 5000);
            req.controller.signal.addEventListener(
                "abort",
                () => {
                    clearTimeout(t);
                    reject(req.controller.signal.reason);
                },
                { once: true },
            );
        });
        res.json({ done: true });
    });

    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const port = server.address().port;

    try {
        const res = await fetch(`http://localhost:${port}`);
        const body = await res.json();
        expect(body.error.message).toBe("Bad Gateway");
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test("handler throw before timeout aborts controller", async () => {
    const app = new App({ requestTimeout: 1000 });
    app.get("/", () => {
        throw new Error("boom");
    });
    app.use((err, req, res) => {
        res.status(500).json({ error: err.message });
    });

    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const port = server.address().port;

    try {
        const res = await fetch(`http://localhost:${port}`);
        const body = await res.json();
        expect(body.error).toBe("boom");
        expect(res.status).toBe(500);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
