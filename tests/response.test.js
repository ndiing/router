require("../src/polyfill");
const App = require("../src");
const { Response } = require("../src/response");

function makeRes() {
    const res = Object.create(Response.prototype);
    res.headers = {};
    res.done = false;
    res.statusCode = 200;
    res.setHeader = function (k, v) {
        this.headers[k] = v;
        return this;
    };
    res.appendHeader = function (k, v) {
        const prev = this.headers[k];
        if (prev === undefined) this.headers[k] = [v];
        else if (Array.isArray(prev)) prev.push(v);
        else this.headers[k] = [prev, v];
        return this;
    };
    res.end = function (...args) {
        this.done = true;
        this.ended = args;
        return this;
    };
    return res;
}

describe("Response.status", () => {
    test("sets statusCode and chains", () => {
        const res = makeRes();
        expect(res.status(201)).toBe(res);
        expect(res.statusCode).toBe(201);
    });
});

describe("Response.send", () => {
    test("calls end with chunk", () => {
        const res = makeRes();
        res.send("hello");
        expect(res.done).toBe(true);
        expect(res.ended).toEqual(["hello"]);
    });
});

describe("Response.json", () => {
    test("sets content-type and serializes", () => {
        const res = makeRes();
        res.json({ a: 1 });
        expect(res.headers["Content-Type"]).toBe("application/json");
        expect(res.ended).toEqual(['{"a":1}']);
    });
});

describe("Response.cookie", () => {
    test("appends Set-Cookie", () => {
        const res = makeRes();
        res.cookie("a", "1");
        expect(res.headers["Set-Cookie"]).toEqual(["a=1; Path=/; SameSite=Lax"]);
    });
    test("multiple cookies", () => {
        const res = makeRes();
        res.cookie("a", "1").cookie("b", "2");
        expect(res.headers["Set-Cookie"].length).toBe(2);
    });
});

// test("download streams file with attachment header", async () => {
//   const fs = require("node:fs");
//   const os = require("node:os");
//   const path = require("node:path");
//   const file = path.join(os.tmpdir(), "dl-test.txt");
//   fs.writeFileSync(file, "hello-file");

//   const app = new App();
//   app.get("/dl", (req, res) => res.download(file, "greeting.txt"));
//   const server = await app.listen(0);

//   const res = await request(server, { path: "/dl" });
//   expect(res.headers["content-disposition"]).toContain('filename="greeting.txt"');
//   expect(res.body).toBe("hello-file");

//   await close(server);
//   fs.unlinkSync(file);
// });
