const App = require("../src/index");

// ============================================================
// HELPERS
// ============================================================

function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        if (signal) {
            signal.addEventListener(
                "abort",
                () => {
                    clearTimeout(timer);
                    reject(signal.reason);
                },
                { once: true },
            );
        }
    });
}

async function stopServer(server) {
    await new Promise((resolve) => server.close(resolve));
}

// ============================================================
// TESTS
// ============================================================

describe("timeout", () => {
    // ----------------------------------------------------------
    // TANPA TIMEOUT (default)
    // ----------------------------------------------------------

    describe("tanpa timeout", () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = new App();
            app.get("/", (req, res) => res.json({ ok: true }));
            app.get("/slow", async (req, res) => {
                await sleep(100);
                res.json({ ok: true });
            });
            ({ server, baseUrl } = { server: app.listen(0) });
            baseUrl = `http://localhost:${server.address().port}`;
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("handler cepet — sukses", async () => {
            const response = await fetch(`${baseUrl}/`);
            expect(response.status).toBe(200);
        });

        test("handler lambat — tetap sukses (nggak ada timeout)", async () => {
            const response = await fetch(`${baseUrl}/slow`);
            expect(response.status).toBe(200);
        });

        test("req.signal undefined", async () => {
            let capturedSignal;
            const app = new App();
            app.get("/signal", (req, res) => {
                capturedSignal = req.signal;
                res.json({ ok: true });
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            await fetch(`${url}/signal`);
            expect(capturedSignal).toBe(undefined);

            await stopServer(s);
        });
    });

    // ----------------------------------------------------------
    // DENGAN TIMEOUT
    // ----------------------------------------------------------

    describe("dengan timeout", () => {
        let server;
        let baseUrl;

        beforeAll(() => {
            const app = new App({ requestTimeout: 200 });
            app.get("/", (req, res) => res.json({ ok: true }));
            app.get("/slow", async (req, res) => {
                await sleep(1000);
                res.json({ ok: true });
            });
            app.get("/medium", async (req, res) => {
                await sleep(100);
                res.json({ ok: true });
            });
            ({ server } = { server: app.listen(0) });
            baseUrl = `http://localhost:${server.address().port}`;
        });

        afterAll(async () => {
            await stopServer(server);
        });

        test("handler cepet — sukses, nggak timeout", async () => {
            const response = await fetch(`${baseUrl}/`);
            expect(response.status).toBe(200);
        });

        test("handler medium — sukses, nggak timeout", async () => {
            const response = await fetch(`${baseUrl}/medium`);
            expect(response.status).toBe(200);
        });

        test("handler lambat — 504", async () => {
            const response = await fetch(`${baseUrl}/slow`);
            expect(response.status).toBe(504);
        });

        test("handler lambat — body 504", async () => {
            const response = await fetch(`${baseUrl}/slow`);
            const result = await response.json();
            expect(result.error.message).toBe("Gateway Timeout");
        });

        test("req.signal ada saat timeout aktif", async () => {
            let capturedSignal;
            const app = new App({ requestTimeout: 200 });
            app.get("/signal", (req, res) => {
                capturedSignal = req.signal;
                res.json({ ok: true });
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            await fetch(`${url}/signal`);
            expect(!!capturedSignal).toBe(true);
            expect(capturedSignal instanceof AbortSignal).toBe(true);

            await stopServer(s);
        });

        test("req.signal.aborted true setelah timeout", async () => {
            let capturedSignal;
            const app = new App({ requestTimeout: 100 });
            app.get("/slow", async (req, res) => {
                capturedSignal = req.signal;
                await sleep(500);
                res.json({ ok: true });
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            await fetch(`${url}/slow`);
            // tunggu sebentar biar abort kepanggil
            await sleep(50);
            expect(capturedSignal.aborted).toBe(true);

            await stopServer(s);
        });

        test("handler kooperatif — abort dan 504", async () => {
            const app = new App({ requestTimeout: 100 });
            app.get("/slow", async (req, res) => {
                await sleep(500, req.signal);
                res.json({ ok: true });
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            const response = await fetch(`${url}/slow`);
            expect(response.status).toBe(504);

            await stopServer(s);
        });
    });

    // ----------------------------------------------------------
    // ERROR HANDLER
    // ----------------------------------------------------------

    describe("error handler", () => {
        test("error handler dipanggil setelah timeout", async () => {
            const app = new App({ requestTimeout: 100 });
            let errorHandlerCalled = false;
            app.get("/slow", async (req, res) => {
                await sleep(500);
                res.json({ ok: true });
            });
            app.use((err, req, res) => {
                errorHandlerCalled = true;
                res.statusCode = err.statusCode || 500;
                res.json({ error: err.message });
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            const response = await fetch(`${url}/slow`);
            expect(response.status).toBe(504);
            expect(errorHandlerCalled).toBe(true);

            await stopServer(s);
        });

        test("handler throw error — error handler, bukan timeout", async () => {
            const app = new App({ requestTimeout: 5000 });
            app.get("/error", () => {
                throw new Error("Test error");
            });
            app.use((err, req, res) => {
                res.statusCode = err.statusCode || 500;
                res.json({ error: err.message });
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            const response = await fetch(`${url}/error`);
            expect(response.status).toBe(500);
            const result = await response.json();
            expect(result.error).toBe("Test error");

            await stopServer(s);
        });
    });

    // ----------------------------------------------------------
    // EDGE CASE
    // ----------------------------------------------------------

    describe("edge case", () => {
        test("handler nulis setelah timeout — nggak crash", async () => {
            const app = new App({ requestTimeout: 100 });
            app.get("/slow", async (req, res) => {
                await sleep(300);
                res.json({ ok: true }); // <-- nulis setelah timeout
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            const response = await fetch(`${url}/slow`);
            expect(response.status).toBe(504);

            // tunggu handler selesai nulis
            await sleep(300);
            // kalau nggak crash, test lolos

            await stopServer(s);
        });

        test("handler reject setelah timeout — nggak unhandled rejection", async () => {
            const app = new App({ requestTimeout: 100 });
            app.get("/slow", async (req, res) => {
                await sleep(300);
                throw new Error("Error after timeout");
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            const response = await fetch(`${url}/slow`);
            expect(response.status).toBe(504);

            await sleep(300);

            await stopServer(s);
        });

        test("timeout 0 — nggak ada timeout", async () => {
            const app = new App({ requestTimeout: 0 });
            app.get("/slow", async (req, res) => {
                await sleep(100);
                res.json({ ok: true });
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            const response = await fetch(`${url}/slow`);
            expect(response.status).toBe(200);

            await stopServer(s);
        });

        test("timeout undefined — nggak ada timeout", async () => {
            const app = new App();
            app.get("/slow", async (req, res) => {
                await sleep(100);
                res.json({ ok: true });
            });
            const s = app.listen(0);
            const url = `http://localhost:${s.address().port}`;

            const response = await fetch(`${url}/slow`);
            expect(response.status).toBe(200);

            await stopServer(s);
        });
    });
});
