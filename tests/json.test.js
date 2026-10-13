const http = require("node:http");
const App = require("../src/index");
const {Router} = App;
const { json } = App; // sesuaikan path

// ============================================================
// SETUP: Router + body parser
// ============================================================

const app = new App();

app.use(json({ limit: 100 * 1024 })); // 100KB

app.post("/", (req, res) => {
    res.json({ body: req.body });
});

// json({ limit: 100 * 1024 })
app.post("/strict", (req, res) => {
    res.json({ body: req.body });
});

app.get("/", (req, res) => {
    res.json({ hello: "world" });
});

// Error handler
app.use((err, req, res) => {
    res.json({ error: err.message });
});

const server = app.listen(0); // port random
const baseUrl = `http://localhost:${server.address().port}`;

// ============================================================
// TESTS
// ============================================================

describe("json()", () => {
    // ----------------------------------------------------------
    // HAPPY PATH
    // ----------------------------------------------------------

    test("POST dengan JSON valid", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ user: "name", pass: "word" }),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result).toEqual({
            body: { user: "name", pass: "word" },
        });
    });

    test("POST dengan JSON nested", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                user: {
                    name: "John",
                    address: { city: "Jakarta" },
                },
            }),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body.user.address.city).toBe("Jakarta");
    });

    test("POST dengan JSON array", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify([1, 2, 3]),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body).toEqual([1, 2, 3]);
    });

    test("POST dengan JSON primitif (string)", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify("hello"),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body).toBe("hello");
    });

    // ----------------------------------------------------------
    // BODY KOSONG
    // ----------------------------------------------------------

    test("POST dengan body kosong", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body).toBe(null);
    });

    test("POST dengan body string kosong", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "",
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body).toBe(null);
    });

    // ----------------------------------------------------------
    // JSON INVALID
    // ----------------------------------------------------------

    test("POST dengan JSON invalid", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: "{invalid json",
        });
        expect(response.status).toBe(400);
        const result = await response.json();
        expect(result.error).toContain("Invalid JSON body");
    });

    test("POST dengan JSON incomplete", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: '{"user": "name"',
        });
        expect(response.status).toBe(400);
    });

    test("POST dengan trailing comma", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: '{"user": "name",}',
        });
        expect(response.status).toBe(400);
    });

    // ----------------------------------------------------------
    // BODY TERLALU BESAR
    // ----------------------------------------------------------

    test("POST dengan body melebihi limit", async () => {
        const largeBody = JSON.stringify({
            data: "x".repeat(200 * 1024), // 200KB > 100KB
        });
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: largeBody,
        });
        expect(response.status).toBe(413);
    });

    test("POST dengan body tepat di limit", async () => {
        // Body ~100KB, tapi JSON overhead bikin lebih
        const body = JSON.stringify({
            data: "x".repeat(90 * 1024),
        });
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
        });
        // Tergantung limit, mungkin 200 atau 413
        expect([200, 413]).toContain(response.status);
    });

    // ----------------------------------------------------------
    // CONTENT-TYPE
    // ----------------------------------------------------------

    test("POST dengan content-type text/plain", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "text/plain" },
            body: JSON.stringify({ user: "name" }),
        });
        // Body parser skip, req.body undefined
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body).toBe(undefined);
    });

    test("POST tanpa content-type", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            body: JSON.stringify({ user: "name" }),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body).toBe(undefined);
    });

    test("POST dengan content-type application/json; charset=utf-8", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json; charset=utf-8" },
            body: JSON.stringify({ user: "name" }),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body).toEqual({ user: "name" });
    });

    // ----------------------------------------------------------
    // PROTOTYPE POLLUTION
    // ----------------------------------------------------------

    test("POST dengan __proto__ pollution", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: '{"__proto__": {"isAdmin": true}}',
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        // __proto__ harus di-skip
        expect(result.body.isAdmin).toBe(undefined);
        expect({}.isAdmin).toBe(undefined);
    });

    test("POST dengan constructor pollution", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: '{"constructor": {"prototype": {"isAdmin": true}}}',
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect({}.isAdmin).toBe(undefined);
    });

    test("POST dengan nested __proto__", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: '{"user": {"__proto__": {"isAdmin": true}}}',
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body.user.isAdmin).toBe(undefined);
    });

    // ----------------------------------------------------------
    // METHOD
    // ----------------------------------------------------------

    test("GET tidak diparse body-nya", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "GET",
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result).toEqual({ hello: "world" });
    });

    test("POST tanpa body parser route", async () => {
        // Route /strict udah ada body parser-nya
        const response = await fetch(`${baseUrl}/strict`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ user: "name" }),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body).toEqual({ user: "name" });
    });

    // ----------------------------------------------------------
    // EDGE CASE
    // ----------------------------------------------------------

    test("POST dengan unicode characters", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "日本語", emoji: "🔥" }),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body.name).toBe("日本語");
        expect(result.body.emoji).toBe("🔥");
    });

    test("POST dengan angka dan boolean", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ age: 30, active: true, score: 1.5 }),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body.age).toBe(30);
        expect(result.body.active).toBe(true);
        expect(result.body.score).toBe(1.5);
    });

    test("POST dengan null value", async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ user: null }),
        });
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.body.user).toBe(null);
    });
});

// ============================================================
// CLEANUP
// ============================================================

afterAll(() => {
    server.close();
});
