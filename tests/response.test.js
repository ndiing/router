const App = require("../src");
const { Response } = require("../src/response");

function mockResponse() {
    // bikin instance tanpa beneran http server
    const res = Object.create(Response.prototype);
    res.statusCode = 200;
    res.headers = {};
    res.body = "";
    // stub method parent
    res.setHeader = (k, v) => {
        res.headers[k] = v;
    };
    res.end = (chunk) => {
        if (chunk) res.body += chunk;
    };
    res.write = (chunk) => {
        res.body += chunk;
    };
    res.writeHead = () => {};
    res.flushHeaders = () => {};
    return res;
}

describe("Response", () => {
    test("done getter/setter", () => {
        const res = mockResponse();
        expect(res.done).toBe(undefined);
        res.done = true;
        expect(res.done).toBe(true);
    });
    test("status chainable", () => {
        const res = mockResponse();
        expect(res.status(201)).toBe(res);
        expect(res.statusCode).toBe(201);
    });
    test("json set content-type & end", () => {
        const res = mockResponse();
        res.json({ a: 1 });
        expect(res.headers["Content-Type"]).toBe("application/json");
        expect(res.body).toBe('{"a":1}');
    });
    test("send end chunk", () => {
        const res = mockResponse();
        res.send("hi");
        expect(res.body).toBe("hi");
    });
});

test("writeHead & flushHeaders via integrasi", async () => {
    const app = new App();
    app.get("/wh", (req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
    });
    app.get("/fh", (req, res) => {
        res.flushHeaders();
        res.end("ok");
    });
    const server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    const { port } = server.address();

    const r1 = await fetch(`http://localhost:${port}/wh`);
    expect(r1.status).toBe(200);
    expect(await r1.text()).toBe("ok");

    const r2 = await fetch(`http://localhost:${port}/fh`);
    expect(r2.status).toBe(200);
    expect(await r2.text()).toBe("ok");

    await new Promise((r) => server.close(r));
});
