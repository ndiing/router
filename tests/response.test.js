const fs = require("fs");
const path = require("path");
const os = require("os");
const { Response } = require("../src/response");
const { App } = require("../src/app");

describe("download()", () => {
    // bikin file temporary sekali di awal
    const tmpFile = path.join(os.tmpdir(), `test-download-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, "file content");

    // test("kirim file + Content-Disposition + Content-Length", async () => {
    //     const app = new App();
    //     app.get("/download", async (req, res) => {
    //         await res.download(tmpFile, "download.txt");
    //     });
    //     const server = app.listen(0);
    //     const port = server.address().port;
    //     const res = await fetch(`http://127.0.0.1:${port}/download`);
    //     expect(res.status).toBe(200);
    //     expect(res.headers.get("content-disposition")).toMatch(/attachment/);
    //     expect(res.headers.get("content-length")).toBe("12");
    //     expect(await res.text()).toBe("file content");
    //     server.close();
    // });

    // test("file nggak ada → 404", async () => {
    //     const app = new App();
    //     app.get("/download", async (req, res) => {
    //         await res.download("/nonexistent/file.txt");
    //     });
    //     const server = app.listen(0);
    //     const port = server.address().port;
    //     const res = await fetch(`http://127.0.0.1:${port}/download`);
    //     expect(res.status).toBe(404);
    //     server.close();
    // });

    // test("tanpa filename — pake basename", async () => {
    //     const app = new App();
    //     app.get("/download", async (req, res) => {
    //         await res.download(tmpFile);
    //     });
    //     const server = app.listen(0);
    //     const port = server.address().port;
    //     const res = await fetch(`http://127.0.0.1:${port}/download`);
    //     expect(res.headers.get("content-disposition")).toMatch(
    //         new RegExp(`filename="${path.basename(tmpFile)}"`)
    //     );
    //     server.close();
    // });
});

describe("send() & json() — default Content-Type", () => {
    // test("send() pake text/plain kalau Content-Type belum di-set", async () => {
    //     const app = new App();
    //     app.get("/", (req, res) => res.send("hello"));
    //     const server = app.listen(0);
    //     const port = server.address().port;
    //     const res = await fetch(`http://127.0.0.1:${port}/`);
    //     expect(res.headers.get("content-type")).toMatch(/text\/plain/);
    //     server.close();
    // });

    // test("send() nggak override Content-Type kalau udah di-set", async () => {
    //     const app = new App();
    //     app.get("/", (req, res) => res.type("text/html").send("<h1>hi</h1>"));
    //     const server = app.listen(0);
    //     const port = server.address().port;
    //     const res = await fetch(`http://127.0.0.1:${port}/`);
    //     expect(res.headers.get("content-type")).toBe("text/html");
    //     server.close();
    // });

    test("json() pake application/json", async () => {
        const app = new App();
        app.get("/", (req, res) => res.json({ a: 1 }));
        const server = app.listen(0);
        const port = server.address().port;
        const res = await fetch(`http://127.0.0.1:${port}/`);
        expect(res.headers.get("content-type")).toMatch(/application\/json/);
        expect(await res.json()).toEqual({ a: 1 });
        server.close();
    });
});

describe("App timeout & fallback", () => {
    test("handler error → 500", async () => {
        const app = new App();
        app.get("/error", () => {
            throw new Error("boom");
        });
        const server = app.listen(0);
        const port = server.address().port;
        const res = await fetch(`http://127.0.0.1:${port}/error`);
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body.error.message).toBe("boom");
        server.close();
    });

    test("route nggak ada → 404", async () => {
        const app = new App();
        const server = app.listen(0);
        const port = server.address().port;
        const res = await fetch(`http://127.0.0.1:${port}/nonexistent`);
        expect(res.status).toBe(404);
        server.close();
    });
});
// test("set() chainable", async () => {
//     const app = new App();
//     app.get("/", (req, res) => {
//         res.set("X-Custom", "value");
//         res.end();
//     });
//     const server = app.listen(0);
//     const port = server.address().port;
//     const res = await fetch(`http://127.0.0.1:${port}/`);
//     expect(res.headers.get("x-custom")).toBe("value");
//     server.close();
// });

// describe("download stream error", () => {
//     test("error pas stream, headersSent false → 500", async () => {
//         const original = fs.createReadStream;
//         // mock: stream langsung error
//         fs.createReadStream = () => {
//             const { Readable } = require("stream");
//             const stream = new Readable({ read() {} });
//             process.nextTick(() => stream.emit("error", new Error("disk error")));
//             return stream;
//         };
//         try {
//             const app = new App();
//             app.get("/download", async (req, res) => {
//                 await res.download(__filename);   // file ada (stat sukses), tapi stream error
//             });
//             const server = app.listen(0);
//             const port = server.address().port;
//             const res = await fetch(`http://127.0.0.1:${port}/download`);
//             expect(res.status).toBe(500);
//             server.close();
//         } finally {
//             fs.createReadStream = original;   // restore
//         }
//     });
// });
