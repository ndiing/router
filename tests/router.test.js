const { inspect } = require("node:util");
const { Router } = require("../src/router");

// helper buat handler dummy (arity 2 = middleware/handler biasa)
const h = () => () => {};
// helper buat error handler (arity 3 = CATCH)
const eh = () => (err, req, res) => {};
const toObject = (obj) => JSON.parse(JSON.stringify(obj));

describe("Router", () => {
    describe("add", () => {
        test("add static route", () => {
            const r = new Router();
            r.get("/api", h());
            expect(r.root.children.has("/api")).toBe(true);
        });

        test("add param route", () => {
            const r = new Router();
            r.get("/:id", h());
            expect(r.root.children.get("/").params.has(":id")).toBe(true);
        });

        test("add wildcard route", () => {
            const r = new Router();
            r.get("/*", h());
            expect(r.root.children.get("/") !== null).toBe(true);
        });

        test("add handler with method", () => {
            const r = new Router();
            r.get("/api", h());
            const api = r.root.children.get("/api");
            expect(api.handlers.has("GET")).toBe(true);
            expect(api.handlers.get("GET").length).toBe(1);
        });

        test("add multiple methods same path", () => {
            const r = new Router();
            r.get("/api", h());
            r.post("/api", h());
            const api = r.root.children.get("/api");
            expect(api.handlers.has("GET")).toBe(true);
            expect(api.handlers.has("POST")).toBe(true);
        });

        test("use registers as ALL", () => {
            const r = new Router();
            r.use(h());
            expect(r.root.handlers.has("ALL")).toBe(true);
        });

        test("arity 3 registers as CATCH", () => {
            const r = new Router();
            r.use(eh());
            expect(r.root.handlers.has("CATCH")).toBe(true);
        });

        test("seq increments per handler", () => {
            const r = new Router();
            r.get("/a", h());
            r.get("/b", h());
            const a = r.root.children.get("/").children.get("a");
            const b = r.root.children.get("/").children.get("b");
            expect(a.handlers.get("GET")[0].seq).toBe(0);
            expect(b.handlers.get("GET")[0].seq).toBe(1);
        });
    });

    describe("find - static routing", () => {
        test("matches exact static path", () => {
            const r = new Router();
            r.get("/api/users", h());
            const res = r.find("GET", "/api/users");
            // expect(res.matched).toBe(true);
            expect(Object.keys(res.handlers).length).toBe(1);
        });

        test("does not match different static path", () => {
            const r = new Router();
            r.get("/api/users", h());
            const res = r.find("GET", "/api/posts");
            // expect(res.matched).toBe(false);
            expect(Object.keys(res.handlers).length).toBe(0);
        });

        test("does not match different method", () => {
            const r = new Router();
            r.get("/api", h());
            const res = r.find("POST", "/api");
            // expect(res.matched).toBe(false);
            // matched path, tapi method handler kosong
            expect(Object.keys(res.handlers).length).toBe(0);
        });

        test("root path", () => {
            const r = new Router();
            r.get("/", h());
            const res = r.find("GET", "/");
            // expect(res.matched).toBe(true);
            expect(Object.keys(res.handlers).length).toBe(1);
        });

        // test("root path with trailing slash", () => {
        //     const r = new Router();
        //     r.get("/", h());
        //     const res = r.find("GET", "//");
        // expect(res.matched).toBe(false);
        // });
    });

    describe("find - param routing", () => {
        test("matches single param", () => {
            const r = new Router();
            r.get("/:id", h());
            const res = r.find("GET", "/321");
            // expect(res.matched).toBe(true);
            expect(res.params.id).toBe("321");
        });

        test("matches multiple params", () => {
            const r = new Router();
            r.get("/:user/:post", h());
            const res = r.find("GET", "/alice/42");
            // expect(res.matched).toBe(true);
            expect(res.params.user).toBe("alice");
            expect(res.params.post).toBe("42");
        });

        test("param takes priority over wildcard", () => {
            const r = new Router();
            r.get("/:id", h());
            r.get("/*", h());
            const res = r.find("GET", "/321");
            // expect(res.matched).toBe(true);
            expect(res.params.id).toBe("321");
        });

        test("static takes priority over param", () => {
            const r = new Router();
            r.get("/:id", h());
            r.get("/api", h());
            const res = r.find("GET", "/api");
            // expect(res.matched).toBe(true);
            // static match, params harus kosong
            expect(res.params.id).toBe(undefined);
        });

        // test("decodes param", () => {
        //     const r = new Router();
        //     r.get("/:id", h());
        //     const res = r.find("GET", "/hello%20world");
        //     expect(res.params.id).toBe("hello world");
        // });

        test("multiple param children both tried", () => {
            const r = new Router();
            r.get("/:id", h());
            r.get("/:userid/details", h());
            const res = r.find("GET", "/321/details");
            // expect(res.matched).toBe(true);
            expect(res.params.userid).toBe("321");
        });
    });

    describe("find - wildcard", () => {
        test("wildcard matches single segment", () => {
            const r = new Router();
            r.get("/*", h());
            const res = r.find("GET", "/api");
            // expect(res.matched).toBe(true);
            expect(res.params.wildcard).toBe("api");
        });

        test("wildcard matches multiple segments", () => {
            const r = new Router();
            r.get("/*", h());
            const res = r.find("GET", "/api/users/321");
            // expect(res.matched).toBe(true);
            expect(res.params.wildcard).toBe("api/users/321");
        });

        test("wildcard on subpath", () => {
            const r = new Router();
            r.get("/api/*", h());
            const res = r.find("GET", "/api/users/321");
            // expect(res.matched).toBe(true);
            expect(res.params.wildcard).toBe("users/321");
        });

        test("wildcard lowest priority", () => {
            const r = new Router();
            r.get("/api", h());
            r.get("/*", h());
            const res = r.find("GET", "/api");
            // static match, bukan wildcard
            expect(res.params.wildcard).toBe(undefined);
        });
    });

    describe("find - middleware", () => {
        test("ALL middleware collected", () => {
            const r = new Router();
            r.use(h());
            r.get("/api", h());
            const res = r.find("GET", "/api");
            expect(Object.keys(res.handlers).length).toBe(2);
        });

        test("error handler collected", () => {
            const r = new Router();
            r.use(eh());
            r.get("/api", h());
            const res = r.find("GET", "/api");
            expect(Object.keys(res.errorHandlers).length).toBe(1);
        });

        test("method handler only on leaf", () => {
            const r = new Router();
            r.get("/api", h());
            r.get("/api/users", h());
            const res = r.find("GET", "/api/users");
            // handler /api tidak jalan (bukan middleware)
            expect(Object.keys(res.handlers).length).toBe(1);
        });
    });

    describe("find - nested router", () => {
        test("nested router merge", () => {
            const child = new Router();
            child.get("/users", h());

            const parent = new Router();
            parent.use("/api", child);

            const res = parent.find("GET", "/api/users");
            // expect(res.matched).toBe(true);
            expect(Object.keys(res.handlers).length).toBe(1);
        });

        test("nested router with params", () => {
            const child = new Router();
            child.get("/:id", h());

            const parent = new Router();
            parent.use("/users", child);

            const res = parent.find("GET", "/users/321");
            // expect(res.matched).toBe(true);
            expect(res.params.id).toBe("321");
        });

        test("nested router seq preserved order", () => {
            const child = new Router();
            child.get("/x", h());

            const parent = new Router();
            parent.use(h()); // seq 0
            parent.use("/api", child); // child seq 0 -> parent seq 1
            parent.get("/y", h()); // seq 2

            const res = parent.find("GET", "/api/x");
            expect(Object.keys(res.handlers).length).toBe(2); // middleware + child handler
        });
    });

    describe("find - partial match", () => {
        test("no match at all returns root middleware only", () => {
            const r = new Router();
            r.use(h());
            r.get("/api", h());

            const res = r.find("GET", "/unknown");

            // expect(res.matched).toBe(false);
            expect(Object.keys(res.handlers).length).toBe(1);
        });

        test("partial match returns middleware from matched prefix", () => {
            const r = new Router();
            r.use(h());
            r.use("/api", h());
            r.get("/api/users", h());

            const res = r.find("GET", "/api/unknown");

            // expect(res.matched).toBe(false);
            expect(Object.keys(res.handlers).length).toBe(2);
        });
    });

    // describe("find - paramsLength", () => {
    //     test("paramsLength 0 when no params", () => {
    //         const r = new Router();
    //         r.get("/api", h());
    //         const res = r.find("GET", "/api");
    //         expect(res.paramsLength).toBe(0);
    //     });

    //     test("paramsLength counts params", () => {
    //         const r = new Router();
    //         r.get("/:a/:b", h());
    //         const res = r.find("GET", "/x/y");
    //         expect(res.paramsLength).toBe(2);
    //     });
    // });
});
describe("method shorthand", () => {
    test("put registers PUT", () => {
        const r = new Router();
        r.put("/api", h());
        expect(r.root.children.get("/api").handlers.has("PUT")).toBe(true);
    });

    test("query registers QUERY", () => {
        const r = new Router();
        r.query("/api", h());
        expect(r.root.children.get("/api").handlers.has("QUERY")).toBe(true);
    });

    test("head registers HEAD", () => {
        const r = new Router();
        r.head("/api", h());
        expect(r.root.children.get("/api").handlers.has("HEAD")).toBe(true);
    });

    test("options registers OPTIONS", () => {
        const r = new Router();
        r.options("/api", h());
        expect(r.root.children.get("/api").handlers.has("OPTIONS")).toBe(true);
    });

    test("trace registers TRACE", () => {
        const r = new Router();
        r.trace("/api", h());
        expect(r.root.children.get("/api").handlers.has("TRACE")).toBe(true);
    });

    test("connect registers CONNECT", () => {
        const r = new Router();
        r.connect("/api", h());
        expect(r.root.children.get("/api").handlers.has("CONNECT")).toBe(true);
    });

    test("patch registers PATCH", () => {
        const r = new Router();
        r.patch("/api", h());
        expect(r.root.children.get("/api").handlers.has("PATCH")).toBe(true);
    });

    test("delete registers DELETE", () => {
        const r = new Router();
        r.delete("/api", h());
        expect(r.root.children.get("/api").handlers.has("DELETE")).toBe(true);
    });
});

test("nested same param name", () => {
    const r = new Router();
    r.get("/:id/:id", h());
    const res = r.find("GET", "/a/b");
    // expect(res.matched).toBe(true);
    // params.id = "b" (yang terakhir menang)
    expect(res.params.id).toBe("b");
});
test("same param name nested - failed match restores prev", () => {
    const r = new Router();
    r.get("/:id/:id/details", h());
    const res = r.find("GET", "/a/b/unknown");
    // expect(res.matched).toBe(false);
});
test("PUT /users/me falls back to /users/:id", () => {
    const calls = [];
    const r = new Router();
    r.get("/users/me", () => calls.push("get me"));
    r.get("/users/:id", () => calls.push("get id"));
    r.put("/users/:id", () => calls.push("put id"));

    const res = r.find("PUT", "/users/me");
    // expect(res.matched).toBe(true);
    expect(res.params.id).toBe("me");
    expect(Object.keys(res.handlers).length).toBe(1);
    // res.handlers[0]();
    // expect(calls).toEqual(["put id"]);
});
test("failed param branch does not leak params into wildcard match", () => {
    const r = new Router();
    r.get("/a/:x/b", () => {});
    r.get("/*", () => {});
    const res = r.find("GET", "/a/1/c");
    // expect(res.matched).toBe(true);
    expect(toObject(res.params)).toEqual({ wildcard: "a/1/c" });
});
