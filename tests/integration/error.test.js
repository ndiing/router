const { App } = require("../../src/app");
const { startServer } = require("../setup");

describe("integration: error", () => {
    let server;
    let baseUrl;

    beforeAll(async () => {
        const app = new App({ requestTimeout: 100 });

        app.get("/error", (req, res) => {
            throw new Error("boom");
        });

        app.get("/async-error", async (req, res) => {
            throw new Error("async boom");
        });

        app.get("/slow", async (req, res) => {
            await new Promise((r) => setTimeout(r, 500));
            res.json({ slow: true });
        });

        app.use((err, req, res) => {
            res.status(res.statusCode < 400 ? 500 : res.statusCode).json({ message: err.message });
        });

        const s = await startServer(app);
        server = s;
        baseUrl = s.baseUrl;
    });

    afterAll(async () => {
        await server.close();
    });

    test("sync error caught by custom handler", async () => {
        const r = await fetch(`${baseUrl}/error`);
        expect(r.status).toBe(500);
        const body = await r.json();
        expect(body.message).toBe("boom");
    });

    test("async error caught by custom handler", async () => {
        const r = await fetch(`${baseUrl}/async-error`);
        expect(r.status).toBe(500);
        const body = await r.json();
        expect(body.message).toBe("async boom");
    });

    test("404 for unknown route", async () => {
        const r = await fetch(`${baseUrl}/nonexistent`);
        expect(r.status).toBe(404);
    });

    test("timeout returns 504", async () => {
        const start = Date.now();
        const r = await fetch(`${baseUrl}/slow`);
        const elapsed = Date.now() - start;
        expect(r.status).toBe(504);
        expect(elapsed < 500).toBe(true);
    });
});
