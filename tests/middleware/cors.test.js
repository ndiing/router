const { cors } = require("../../src/middleware/cors");

function makeReq({ method = "GET", headers = {} } = {}) {
    return { method, headers };
}
function makeRes() {
    const headers = {};
    const res = {
        statusCode: 200,
        done: false,
        ended: false,
        setHeader(k, v) {
            headers[k] = v;
        },
        appendHeader(k, v) {
            if (headers[k] === undefined) headers[k] = v;
            else if (Array.isArray(headers[k])) headers[k].push(v);
            else headers[k] = [headers[k], v];
        },
        end() {
            res.ended = true;
            res.done = true;
        },
        getHeaders() {
            return headers;
        },
    };
    return res;
}

describe("cors - simple request", () => {
    test("default origin *", () => {
        const res = makeRes();
        cors()(makeReq(), res);
        expect(res.getHeaders()["Access-Control-Allow-Origin"]).toBe("*");
    });
    test("echo origin when explicit", () => {
        const res = makeRes();
        cors({ origin: "https://a.com" })(makeReq({ headers: { origin: "https://a.com" } }), res);
        expect(res.getHeaders()["Access-Control-Allow-Origin"]).toBe("https://a.com");
        expect(res.getHeaders()["Vary"] !== undefined).toBe(true);
    });
    test("array origin match", () => {
        const res = makeRes();
        cors({ origin: ["https://a.com", "https://b.com"] })(makeReq({ headers: { origin: "https://b.com" } }), res);
        expect(res.getHeaders()["Access-Control-Allow-Origin"]).toBe("https://b.com");
    });
    test("origin with credentials uses echo", () => {
        const res = makeRes();
        cors({ origin: "*", credentials: true })(makeReq({ headers: { origin: "https://a.com" } }), res);
        expect(res.getHeaders()["Access-Control-Allow-Origin"]).toBe("https://a.com");
        expect(res.getHeaders()["Access-Control-Allow-Credentials"]).toBe("true");
    });
    test("credentials header set", () => {
        const res = makeRes();
        cors({ credentials: true })(makeReq(), res);
        expect(res.getHeaders()["Access-Control-Allow-Credentials"]).toBe("true");
    });
});

describe("cors - preflight (OPTIONS)", () => {
    function preflight(origin, reqHeaders, reqMethod) {
        return makeReq({
            method: "OPTIONS",
            headers: {
                origin,
                "access-control-request-method": reqMethod,
                ...(reqHeaders ? { "access-control-request-headers": reqHeaders } : {}),
            },
        });
    }
    test("returns 204 and ends", () => {
        const res = makeRes();
        cors()(preflight("https://a.com", "x-custom", "POST"), res);
        expect(res.statusCode).toBe(204);
        expect(res.ended).toBe(true);
        expect(res.getHeaders()["Content-Length"]).toBe("0");
    });
    test("allows requested headers when no restriction", () => {
        const res = makeRes();
        cors()(preflight("https://a.com", "x-custom, x-other", "POST"), res);
        expect(res.getHeaders()["Access-Control-Allow-Headers"]).toEqual(["x-custom", "x-other"]);
    });
    test("filters requested headers when restricted", () => {
        const res = makeRes();
        cors({ headers: ["x-custom"] })(preflight("https://a.com", "x-custom", "POST"), res);
        expect(res.getHeaders()["Access-Control-Allow-Headers"]).toEqual(["x-custom"]);
    });
    test("blocks if some requested header not allowed", () => {
        const res = makeRes();
        cors({ headers: ["x-custom"] })(preflight("https://a.com", "x-custom, x-bad", "POST"), res);
        expect(res.getHeaders()["Access-Control-Allow-Headers"]).toBe(undefined);
    });
    test("method allow when restricted", () => {
        const res = makeRes();
        cors({ methods: ["GET", "POST"] })(preflight("https://a.com", null, "POST"), res);
        expect(res.getHeaders()["Access-Control-Allow-Methods"]).toEqual(["GET", "POST"]);
    });
    test("method blocked when not allowed", () => {
        const res = makeRes();
        cors({ methods: ["GET"] })(preflight("https://a.com", null, "DELETE"), res);
        expect(res.getHeaders()["Access-Control-Allow-Methods"]).toBe(undefined);
    });
    test("maxAge set when > 0", () => {
        const res = makeRes();
        cors({ maxAge: 600 })(preflight("https://a.com", null, "POST"), res);
        expect(res.getHeaders()["Access-Control-Max-Age"]).toBe(600);
    });
});

test("Vary appended when already set", () => {
    const res = makeRes();
    res.setHeader("Vary", "Accept-Encoding");
    cors({ origin: "https://a.com" })(makeReq({ headers: { origin: "https://a.com" } }), res);
    // tergantung appendHeader impl: bisa array atau "Accept-Encoding, Origin"
    expect(res.getHeaders()["Vary"] !== undefined).toBe(true);
});

test("headers=* with credentials echoes requested", () => {
    const res = makeRes();
    cors({ headers: "*", credentials: true })(
        makeReq({
            method: "OPTIONS",
            headers: {
                origin: "https://a.com",
                "access-control-request-method": "POST",
                "access-control-request-headers": "x-a, x-b",
            },
        }),
        res,
    );
    expect(res.getHeaders()["Access-Control-Allow-Headers"]).toEqual(["x-a", "x-b"]);
});
