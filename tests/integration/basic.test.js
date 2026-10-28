const { App } = require("../../src/app");
const { startServer } = require("../setup");

describe("integration: basic", () => {
    let server;
    let baseUrl;

    beforeAll(async () => {
        const app = new App();

        app.use(App.json());

        app.get("/", (req, res) => {
            res.send("<h1>Hello</h1>");
        });

        app.post("/echo", (req, res) => {
            res.status(201).json({ received: req.body });
        });

        app.put("/users/:id", (req, res) => {
            res.json({ id: req.params.id, body: req.body });
        });

        app.delete("/users/:id", (req, res) => {
            res.json({ deleted: req.params.id });
        });

        const s = await startServer(app);
        server = s;
        baseUrl = s.baseUrl;
    });

    afterAll(async () => {
        await server.close();
    });

    test("GET / returns HTML", async () => {
        const r = await fetch(`${baseUrl}/`);
        expect(r.status).toBe(200);
        expect(r.headers.get("content-type")).toBe("text/html");
        const text = await r.text();
        expect(text).toContain("Hello");
    });

    test("POST /echo parses JSON body", async () => {
        const r = await fetch(`${baseUrl}/echo`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "budi" }),
        });
        expect(r.status).toBe(201);
        const body = await r.json();
        expect(body.received).toEqual({ name: "budi" });
    });

    test("PUT /users/:id", async () => {
        const r = await fetch(`${baseUrl}/users/42`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "ani" }),
        });
        const body = await r.json();
        expect(body.id).toBe("42");
        expect(body.body).toEqual({ name: "ani" });
    });

    test("DELETE /users/:id", async () => {
        const r = await fetch(`${baseUrl}/users/42`, {
            method: "DELETE",
        });
        const body = await r.json();
        expect(body.deleted).toBe("42");
    });
});
