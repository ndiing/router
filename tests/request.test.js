const { Request } = require("../src/request");

function makeReq(url) {
    // IncomingMessage constructor butuh socket, tapi kita bisa bypass
    const req = Object.create(Request.prototype);
    req.url = url;
    req.headers = {};
    return req;
}

describe("Request", () => {
    test("path getter parses URL", () => {
        const req = makeReq("/a/b?x=1");
        expect(req.path).toBe("/a/b");
    });

    test("query getter parses query string", () => {
        const req = makeReq("/a/b?x=1&y=2");
        req.path;
        expect(req.query).toEqual({ x: "1", y: "2" });
    });

    test("query handles repeated key", () => {
        const req = makeReq("/a?tag=a&tag=b");
        req.path;
        expect(req.query).toEqual({ tag: ["a", "b"] });
    });

    test("controller is AbortController", () => {
        const req = makeReq("/");
        expect(req.controller instanceof AbortController).toBe(true);
    });

    test("path cached", () => {
        const req = makeReq("/a?x=1");
        const p1 = req.path;
        const p2 = req.path;
        expect(p1).toBe(p2);
    });
});

test("query before path still works", () => {
    const req = makeReq("/a?x=1");
    req.path;
    expect(req.query).toEqual({ x: "1" });
    expect(req.path).toBe("/a");
});
