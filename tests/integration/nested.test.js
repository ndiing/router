const { App } = require("../../src/app");
const { startServer } = require("../setup");

describe("integration: nested", () => {
    let server;
    let baseUrl;

    beforeAll(async () => {
        const users = new App.Router();
        users.get("/", (req, res) => {
            res.json({ users: [] });
        });
        users.get("/:id", (req, res) => {
            res.json({ id: req.params.id });
        });

        const admin = new App.Router();
        admin.use("/users", users);
        admin.get("/", (req, res) => {
            res.json({ admin: true });
        });

        const app = new App();
        app.use("/api", users);
        app.use("/admin", admin);

        const s = await startServer(app);
        server = s;
        baseUrl = s.baseUrl;
    });

    afterAll(async () => {
        await server.close();
    });

    test("GET /api/", async () => {
        const r = await fetch(`${baseUrl}/api/`);
        const body = await r.json();
        expect(body.users).toEqual([]);
    });

    test("GET /api/123", async () => {
        const r = await fetch(`${baseUrl}/api/123`);
        const body = await r.json();
        expect(body.id).toBe("123");
    });

    test("GET /admin/", async () => {
        const r = await fetch(`${baseUrl}/admin/`);
        const body = await r.json();
        expect(body.admin).toBe(true);
    });

    test("GET /admin/users/123 (double-nested)", async () => {
        const r = await fetch(`${baseUrl}/admin/users/123`);
        const body = await r.json();
        expect(body.id).toBe("123");
    });
});
