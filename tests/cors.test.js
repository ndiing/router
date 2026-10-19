const App = require("../src/index");
const { Router, cors } = App;

// ============================================================
// SETUP
// ============================================================

let server;
let baseUrl;

function createApp(corsOptions) {
    const app = new App();
    app.use(cors(corsOptions));
    app.get("/", (req, res) => res.json({ ok: true }));
    app.post("/", (req, res) => res.json({ ok: true }));
    return app;
}

function startServer(app) {
    const server = app.listen(0);
    const baseUrl = `http://localhost:${server.address().port}`;
    return { server, baseUrl };
}

async function stopServer(server) {
    await new Promise((resolve) => server.close(resolve));
}

// ============================================================
// TESTS
// ============================================================

describe("cors()", () => {
    // ----------------------------------------------------------
    // ORIGIN: "*" (default)
    // ----------------------------------------------------------

    describe('origin: "*"', () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp();
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("GET — Allow-Origin: *", async () => {
            const response = await fetch(`${baseUrl}/`);
            expect(response.headers.get("access-control-allow-origin")).toBe("*");
        });

        test("GET — nggak ada Allow-Credentials", async () => {
            const response = await fetch(`${baseUrl}/`);
            expect(response.headers.get("access-control-allow-credentials")).toBe(null);
        });

        test("GET — nggak ada Vary: Origin", async () => {
            const response = await fetch(`${baseUrl}/`);
            const vary = response.headers.get("vary");
            expect(vary === null || !vary.includes("Origin")).toBe(true);
        });

        test("GET dengan Origin header — Allow-Origin tetap *", async () => {
            const response = await fetch(`${baseUrl}/`, {
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("access-control-allow-origin")).toBe("*");
        });

        test("OPTIONS — Allow-Origin: *, status 204", async () => {
            const response = await fetch(`${baseUrl}/`, { method: "OPTIONS" });
            expect(response.status).toBe(204);
            expect(response.headers.get("access-control-allow-origin")).toBe("*");
        });

        test("OPTIONS — Content-Length: 0", async () => {
            const response = await fetch(`${baseUrl}/`, { method: "OPTIONS" });
            expect(response.headers.get("content-length")).toBe("0");
        });

        test("OPTIONS — body kosong", async () => {
            const response = await fetch(`${baseUrl}/`, { method: "OPTIONS" });
            const text = await response.text();
            expect(text).toBe("");
        });
    });

    // ----------------------------------------------------------
    // ORIGIN: "*" + credentials: true
    // ----------------------------------------------------------

    describe('origin: "*", credentials: true', () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp({ origin: "*", credentials: true });
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("GET dengan Origin — echo origin request", async () => {
            const response = await fetch(`${baseUrl}/`, {
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("access-control-allow-origin")).toBe("http://example.com");
        });

        test("GET dengan Origin — Allow-Credentials: true", async () => {
            const response = await fetch(`${baseUrl}/`, {
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("access-control-allow-credentials")).toBe("true");
        });

        test("GET dengan Origin — Vary: Origin", async () => {
            const response = await fetch(`${baseUrl}/`, {
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("vary")).toContain("Origin");
        });

        test("GET tanpa Origin — Allow-Origin echo undefined", async () => {
            const response = await fetch(`${baseUrl}/`);
            // reqOrigin undefined → value = undefined → nggak di-set
            expect(response.headers.get("access-control-allow-origin")).toBe(null);
        });

        test("OPTIONS dengan Origin — echo origin + 204", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: { origin: "http://example.com" },
            });
            expect(response.status).toBe(204);
            expect(response.headers.get("access-control-allow-origin")).toBe("http://example.com");
        });
    });

    // ----------------------------------------------------------
    // ORIGIN: string spesifik
    // ----------------------------------------------------------

    describe('origin: "http://localhost:3000"', () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp({ origin: "http://localhost:3000" });
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("GET dari origin yang match — Allow-Origin di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                headers: { origin: "http://localhost:3000" },
            });
            expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
        });

        test("GET dari origin yang match — Vary: Origin", async () => {
            const response = await fetch(`${baseUrl}/`, {
                headers: { origin: "http://localhost:3000" },
            });
            expect(response.headers.get("vary")).toContain("Origin");
        });

        test("GET dari origin yang nggak match — Allow-Origin nggak di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                headers: { origin: "http://evil.com" },
            });
            expect(response.headers.get("access-control-allow-origin")).toBe(null);
        });

        test("GET tanpa Origin — Allow-Origin nggak di-set", async () => {
            const response = await fetch(`${baseUrl}/`);
            expect(response.headers.get("access-control-allow-origin")).toBe(null);
        });
    });

    // ----------------------------------------------------------
    // ORIGIN: null
    // ----------------------------------------------------------

    describe("origin: null", () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp({ origin: null });
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("GET — Allow-Origin: null", async () => {
            const response = await fetch(`${baseUrl}/`);
            expect(response.headers.get("access-control-allow-origin")).toBe("null");
        });

        test("GET — nggak ada Vary: Origin", async () => {
            const response = await fetch(`${baseUrl}/`);
            const vary = response.headers.get("vary");
            expect(vary === null || !vary.includes("Origin")).toBe(true);
        });
    });

    // ----------------------------------------------------------
    // HEADERS: "*"
    // ----------------------------------------------------------

    describe('headers: "*", credentials: false', () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp({ headers: "*" });
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("OPTIONS dengan ACRH — Allow-Headers: *", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: {
                    origin: "http://example.com",
                    "access-control-request-headers": "content-type",
                },
            });
            expect(response.headers.get("access-control-allow-headers")).toBe("*");
        });

        test("OPTIONS tanpa ACRH — Allow-Headers nggak di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("access-control-allow-headers")).toBe(null);
        });

        test("GET — Expose-Headers: *", async () => {
            const response = await fetch(`${baseUrl}/`);
            expect(response.headers.get("access-control-expose-headers")).toBe("*");
        });
    });

    describe('headers: "*", credentials: true', () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp({ headers: "*", credentials: true });
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("OPTIONS — Allow-Headers nggak di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: {
                    origin: "http://example.com",
                    "access-control-request-headers": "content-type",
                },
            });
            expect(response.headers.get("access-control-allow-headers")).toBe(null);
        });

        test("GET — Expose-Headers nggak di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("access-control-expose-headers")).toBe(null);
        });
    });

    // ----------------------------------------------------------
    // HEADERS: array
    // ----------------------------------------------------------

    describe('headers: ["content-type", "authorization"]', () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp({ headers: ["content-type", "authorization"] });
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("OPTIONS dengan ACRH match — Allow-Headers di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: {
                    origin: "http://example.com",
                    "access-control-request-headers": "content-type",
                },
            });
            const value = response.headers.get("access-control-allow-headers");
            expect(value).toContain("content-type");
            expect(value).toContain("authorization");
        });

        test("OPTIONS dengan ACRH nggak match — Allow-Headers nggak di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: {
                    origin: "http://example.com",
                    "access-control-request-headers": "x-custom",
                },
            });
            expect(response.headers.get("access-control-allow-headers")).toBe(null);
        });

        test("GET — Expose-Headers di-set", async () => {
            const response = await fetch(`${baseUrl}/`);
            const value = response.headers.get("access-control-expose-headers");
            expect(value).toContain("content-type");
            expect(value).toContain("authorization");
        });
    });

    // ----------------------------------------------------------
    // METHODS
    // ----------------------------------------------------------

    describe('methods: "*", credentials: false', () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp({ methods: "*" });
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("OPTIONS dengan ACRM — Allow-Methods: *", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: {
                    origin: "http://example.com",
                    "access-control-request-method": "GET",
                },
            });
            expect(response.headers.get("access-control-allow-methods")).toBe("*");
        });

        test("OPTIONS tanpa ACRM — Allow-Methods nggak di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("access-control-allow-methods")).toBe(null);
        });
    });

    describe('methods: ["GET", "POST"]', () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = createApp({ methods: ["GET", "POST"] });
            ({ server, baseUrl } = startServer(app));
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("OPTIONS dengan ACRM match — Allow-Methods di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: {
                    origin: "http://example.com",
                    "access-control-request-method": "GET",
                },
            });
            const value = response.headers.get("access-control-allow-methods");
            expect(value).toContain("GET");
            expect(value).toContain("POST");
        });

        test("OPTIONS dengan ACRM nggak match — Allow-Methods nggak di-set", async () => {
            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: {
                    origin: "http://example.com",
                    "access-control-request-method": "DELETE",
                },
            });
            expect(response.headers.get("access-control-allow-methods")).toBe(null);
        });
    });

    // ----------------------------------------------------------
    // MAX AGE
    // ----------------------------------------------------------

    describe("maxAge", () => {
        test("maxAge: 3600 — Max-Age di-set", async () => {
            const app = createApp({ maxAge: 3600 });
            const { server, baseUrl } = startServer(app);

            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("access-control-max-age")).toBe("3600");

            await stopServer(server);
        });

        test("maxAge: 0 — Max-Age nggak di-set", async () => {
            const app = createApp({ maxAge: 0 });
            const { server, baseUrl } = startServer(app);

            const response = await fetch(`${baseUrl}/`, {
                method: "OPTIONS",
                headers: { origin: "http://example.com" },
            });
            expect(response.headers.get("access-control-max-age")).toBe(null);

            await stopServer(server);
        });
    });

    test("OPTIONS dengan Origin — Vary: Origin", async () => {
        const app = createApp({ maxAge: 0 });
        const { server, baseUrl } = startServer(app);
        const response = await fetch(`${baseUrl}/`, {
            method: "OPTIONS",
            headers: { origin: "http://example.com" },
        });
        expect(response.headers.get("vary")).toBe(null);
    });

    test("OPTIONS — Vary: Origin nggak di-set", async () => {
        const app = createApp({ maxAge: 0 });
        const { server, baseUrl } = startServer(app);
        const response = await fetch(`${baseUrl}/`, {
            method: "OPTIONS",
            headers: { origin: "http://example.com" },
        });
        const vary = response.headers.get("vary");
        expect(vary === null || !vary.includes("Origin")).toBe(true);
    });

    test("GET dengan Origin — Vary: Origin di-set", async () => {
        const app = createApp({ maxAge: 0, origin: ["http://example.com"] });
        const { server, baseUrl } = startServer(app);
        const response = await fetch(`${baseUrl}/`, {
            headers: { origin: "http://example.com" },
        });
        expect(response.headers.get("vary")).toBe("Origin");
    });
});
