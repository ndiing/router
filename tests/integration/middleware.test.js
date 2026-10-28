const { App } = require("../../src/app");
const { json } = require("../../src/middleware/json");
const { urlencoded } = require("../../src/middleware/urlencoded");
const { cors } = require("../../src/middleware/cors");
const { startServer } = require("../setup");

describe("integration: middleware", () => {
    let server;
    let baseUrl;

    beforeAll(async () => {
        const app = new App();

        app.use(cors({ origin: "*" }));
        app.use(json({ limit: 100 }));
        app.use(urlencoded());

        app.post("/json", (req, res) => {
            res.json({ body: req.body });
        });

        app.post("/form", (req, res) => {
            res.json({ body: req.body });
        });

        const s = await startServer(app);
        server = s;
        baseUrl = s.baseUrl;
    });

    afterAll(async () => {
        await server.close();
    });

    test("CORS header set on GET", async () => {
        const r = await fetch(`${baseUrl}/json`);
        expect(r.headers.get("access-control-allow-origin")).toBe("*");
    });

    test("CORS preflight OPTIONS returns 204", async () => {
        const r = await fetch(`${baseUrl}/json`, {
            method: "OPTIONS",
            headers: {
                origin: "http://example.com",
                "access-control-request-method": "POST",
            },
        });
        expect(r.status).toBe(204);
        expect(r.headers.get("access-control-allow-origin")).toBe("*");
    });

    test("JSON body parsed", async () => {
        const r = await fetch(`${baseUrl}/json`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "budi" }),
        });
        const body = await r.json();
        expect(body.body).toEqual({ name: "budi" });
    });

    test("JSON body too large returns 413", async () => {
        const r = await fetch(`${baseUrl}/json`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ data: "x".repeat(200) }),
        });
        expect(r.status).toBe(413);
    });

    test("invalid JSON returns 400", async () => {
        const r = await fetch(`${baseUrl}/json`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{invalid",
        });
        expect(r.status).toBe(400);
    });

    test("urlencoded body parsed", async () => {
        const r = await fetch(`${baseUrl}/form`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: "name=budi&age=20",
        });
        const body = await r.json();
        expect(body.body).toEqual({ name: "budi", age: "20" });
    });
});
