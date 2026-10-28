const { App } = require("../../src/app");
const { startServer } = require("../setup");

describe("integration: params", () => {
    let server;
    let baseUrl;

    beforeAll(async () => {
        const app = new App();

        app.get("/users/:id", (req, res) => {
            res.json({ id: req.params.id, query: req.query });
        });

        app.get("/files/*", (req, res) => {
            res.json({ wildcard: req.params.wildcard });
        });

        app.get("/me", (req, res) => {
            res.json({ me: true });
        });

        const s = await startServer(app);
        server = s;
        baseUrl = s.baseUrl;
    });

    afterAll(async () => {
        await server.close();
    });

    test("param captured", async () => {
        const r = await fetch(`${baseUrl}/users/123`);
        const body = await r.json();
        expect(body.id).toBe("123");
    });

    test("param with query string", async () => {
        const r = await fetch(`${baseUrl}/users/123?a=1&b=2`);
        const body = await r.json();
        expect(body.id).toBe("123");
        expect(body.query).toEqual({ a: "1", b: "2" });
    });

    test("param URL-decoded", async () => {
        const r = await fetch(`${baseUrl}/users/hello%20world`);
        const body = await r.json();
        expect(body.id).toBe("hello world");
    });

    test("wildcard captures rest", async () => {
        const r = await fetch(`${baseUrl}/files/a/b/c.txt`);
        const body = await r.json();
        expect(body.wildcard).toBe("a/b/c.txt");
    });

    test("literal wins over param", async () => {
        const r = await fetch(`${baseUrl}/me`);
        const body = await r.json();
        expect(body.me).toBe(true);
    });
});
