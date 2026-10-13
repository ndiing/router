const { inspect } = require("node:util");
const App = require("../src/index");
const { Router } = App;

// ============================================================
// SETUP
// ============================================================

let server;
let baseUrl;

beforeAll(() => {
    // ========================================
    // BUILD ROUTER
    // ========================================
    const blogs = new Router();
    blogs.use((req, res) => {}); // middleware
    blogs.get("/:id", (req, res) => res.json({ path: req.path, params: req.params }));
    blogs.get("/", (req, res) => res.json({ path: req.path }));

    const users = new Router();
    users.use((req, res) => {});
    users.get("/:id", (req, res) => res.json({ path: req.path, params: req.params }));
    users.get("/", (req, res) => res.json({ path: req.path }));

    const admin = new Router();
    admin.use((req, res) => {});
    admin.use("/users", users);
    admin.get("/:id", (req, res) => res.json({ path: req.path, params: req.params }));
    admin.get("/", (req, res) => res.json({ path: req.path }));

    const app = new App();
    app.use((req, res) => {}); // global middleware
    app.use("/blogs", blogs);
    app.use("/admin", admin);

    app.get("/:id", (req, res) => res.json({ path: req.path, params: req.params }));
    app.get("/", (req, res) => res.json({ hello: "world" }));

    // Error handler
    app.use((err, req, res) => {
        res.statusCode = err.statusCode || 500;
        res.json({ error: err.message });
    });

    // console.log(inspect(app,false,null,true))

    // ========================================
    // START SERVER
    // ========================================
    server = app.listen(0); // port random
    baseUrl = `http://localhost:${server.address().port}`;
});

afterAll((done) => {
    server.close(done);
});

// ============================================================
// TESTS: find() — UNIT LEVEL
// ============================================================

describe("find()", () => {
    let app;

    beforeAll(() => {
        app = new Router();
        app.use((req, res) => {}); // middleware
        app.get("/:id", (req, res) => {});
        app.get("/", (req, res) => {});
        app.use((err, req, res) => {}); // error handler
    });

    test("GET /asdf/asdf/asdf — no match, cuma global middleware", () => {
        const result = app.find("GET", "/asdf/asdf/asdf");
        expect(result.handlers.length).toBe(1); // cuma global middleware
        expect(result.errorHandlers.length).toBe(1); // error handler
    });

    test("GET / — match root, middleware + handler + error handler", () => {
        const result = app.find("GET", "/");
        expect(result.handlers.length).toBe(2); // middleware + handler
        expect(result.errorHandlers.length).toBe(1);
    });

    test("GET /1 — match dynamic param", () => {
        const result = app.find("GET", "/1");
        expect(result.params.id).toBe("1");
    });

    test("GET /1 — handler chain length", () => {
        const result = app.find("GET", "/1");
        expect(result.handlers.length).toBe(2); // middleware + handler
    });

    test("GET /unknown — no match, cuma middleware", () => {
        const result = app.find("GET", "/a/b/c");
        expect(result.handlers.length).toBe(1); // cuma middleware
        expect(result.params).toEqual({});
    });

    test("POST / — method nggak match", () => {
        const result = app.find("POST", "/");
        // Cuma middleware + error handler, nggak ada handler POST
        expect(result.handlers.length).toBe(1);
    });
});

// ============================================================
// TESTS: fetch() — INTEGRATION LEVEL
// ============================================================

describe("fetch() — integration", () => {
    // ----------------------------------------
    // BASIC ROUTING
    // ----------------------------------------

    test("GET /", async () => {
        const response = await fetch(`${baseUrl}/`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result).toEqual({ hello: "world" });
    });

    test("GET /?age=30 — query string diabaikan", async () => {
        const response = await fetch(`${baseUrl}/?age=30`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result).toEqual({ hello: "world" });
    });

    test("GET /1 — dynamic param", async () => {
        const response = await fetch(`${baseUrl}/1`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result).toEqual({ path: "/1", params: { id: "1" } });
    });

    test("GET /abc — dynamic param dengan string", async () => {
        const response = await fetch(`${baseUrl}/abc`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result).toEqual({ path: "/abc", params: { id: "abc" } });
    });

    // ----------------------------------------
    // NESTED ROUTER
    // ----------------------------------------

    test("GET /blogs — nested router root", async () => {
        const response = await fetch(`${baseUrl}/blogs`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.path).toBe("/blogs");
    });

    test("GET /blogs/123 — nested router dengan param", async () => {
        const response = await fetch(`${baseUrl}/blogs/123`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.path).toBe("/blogs/123");
        expect(result.params.id).toBe("123");
    });

    test("GET /admin — nested router admin", async () => {
        const response = await fetch(`${baseUrl}/admin`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.path).toBe("/admin");
    });

    test("GET /admin/users — nested router 2 level", async () => {
        const response = await fetch(`${baseUrl}/admin/users`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.path).toBe("/admin/users");
    });

    test("GET /admin/users/456 — nested router 2 level dengan param", async () => {
        const response = await fetch(`${baseUrl}/admin/users/456`);
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.path).toBe("/admin/users/456");
        expect(result.params.id).toBe("456");
    });

    // ----------------------------------------
    // 404
    // ----------------------------------------

    test("GET /unknown/deep/path — 404", async () => {
        const response = await fetch(`${baseUrl}/unknown/deep/path`);
        expect(response.status).toBe(404);
        const result = await response.json();
        // expect(result.error).toBeDefined();
        // expect(result.error.message).toBeDefined();
    });

    // ----------------------------------------
    // ERROR HANDLER
    // ----------------------------------------

    test("GET /error — error handler dipanggil", async () => {
        // Tambahin route yang throw
        const testApp = new App();
        testApp.get("/error", () => {
            throw new Error("Test error");
        });
        testApp.use((err, req, res) => {
            res.statusCode = 500;
            res.json({ error: err.message });
        });

        const testServer = testApp.listen(0);
        const testUrl = `http://localhost:${testServer.address().port}`;

        const response = await fetch(`${testUrl}/error`);
        expect(response.status).toBe(500);
        const result = await response.json();
        expect(result.error).toBe("Test error");

        testServer.close();
    });

    // ----------------------------------------
    // MIDDLEWARE
    // ----------------------------------------

    test("Middleware dijalankan sebelum handler", async () => {
        const order = [];
        const testApp = new App();

        testApp.use((req, res) => {
            order.push("middleware-1");
        });
        testApp.use((req, res) => {
            order.push("middleware-2");
        });
        testApp.get("/", (req, res) => {
            order.push("handler");
            res.json({ order });
        });

        const testServer = testApp.listen(0);
        const testUrl = `http://localhost:${testServer.address().port}`;

        const response = await fetch(`${testUrl}/`);
        const result = await response.json();

        expect(result.order).toEqual(["middleware-1", "middleware-2", "handler"]);

        testServer.close();
    });

    test("Middleware bisa stop chain dengan res.done", async () => {
        const testApp = new App();

        testApp.use((req, res) => {
            res.statusCode = 401;
            res.json({ error: "Unauthorized" });
        });
        testApp.get("/", (req, res) => {
            res.json({ hello: "world" }); // nggak akan kepanggil
        });

        const testServer = testApp.listen(0);
        const testUrl = `http://localhost:${testServer.address().port}`;

        const response = await fetch(`${testUrl}/`);
        expect(response.status).toBe(401);
        const result = await response.json();
        expect(result.error).toBe("Unauthorized");

        testServer.close();
    });
});
