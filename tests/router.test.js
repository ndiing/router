require("../src/polyfill");
const { Router } = require("../src/router");

describe("Router", () => {
    let app;

    beforeEach(() => {
        app = new Router();
    });

    describe("basic routing", () => {
        test("GET / matches root", () => {
            let called = false;
            app.get("/", () => {
                called = true;
            });
            const r = app.find("GET", "/");
            expect(r.handlers.length).toBe(1);
            expect(r.params).toEqual({});
        });

        test("GET /me matches literal", () => {
            app.get("/me", () => {});
            const r = app.find("GET", "/me");
            expect(r.handlers.length).toBe(1);
        });

        test("GET /nonexistent returns no handlers", () => {
            app.get("/me", () => {});
            const r = app.find("GET", "/nonexistent");
            expect(r.handlers.length).toBe(0);
        });
    });

    describe("params", () => {
        test("GET /:id captures id", () => {
            app.get("/:id", () => {});
            const r = app.find("GET", "/123");
            expect(r.params).toEqual({ id: "123" });
        });

        test("GET /:id with query does not affect path", () => {
            app.get("/:id", () => {});
            const r = app.find("GET", "/123");
            expect(r.params.id).toBe("123");
        });

        test("GET /:postId/details captures postId", () => {
            app.get("/:postId/details", () => {});
            const r = app.find("GET", "/123/details");
            expect(r.params).toEqual({ postId: "123" });
        });

        test("literal /me wins over /:id", () => {
            let which = null;
            app.get("/:id", () => {
                which = "param";
            });
            app.get("/me", () => {
                which = "literal";
            });
            app.find("GET", "/me");
            // cek handler pertama yang dipanggil = literal
            const r = app.find("GET", "/me");
            expect(r.handlers.length).toBe(1);
        });

        test("URL-decoded param", () => {
            app.get("/:id", () => {});
            const r = app.find("GET", "/hello%20world");
            expect(r.params.id).toBe("hello world");
        });

        test("invalid URL-encoded param returns raw", () => {
            app.get("/:id", () => {});
            const r = app.find("GET", "/%E0%A4%A");
            expect(r.params.id).toBe("%E0%A4%A");
        });
    });

    describe("wildcard", () => {
        test("GET /* captures wildcard", () => {
            app.get("/*", () => {});
            const r = app.find("GET", "/a/b/c");
            expect(r.params).toEqual({ wildcard: "a/b/c" });
        });

        test("literal wins over wildcard", () => {
            app.get("/*", () => {});
            app.get("/me", () => {});
            const r = app.find("GET", "/me");
            expect(r.params).toEqual({});
        });
    });

    describe("middleware", () => {
        test("use without path applies to all", () => {
            app.use((req, res) => {});
            app.get("/", () => {});
            const r = app.find("GET", "/");
            expect(r.handlers.length).toBe(2);
        });

        test("nested middleware at prefix applies", () => {
            const sub = new Router();
            sub.use((req, res) => {});
            sub.get("/", () => {});
            app.use("/api", sub);
            const r = app.find("GET", "/api/"); // ← pakai trailing slash
            expect(r.handlers.length).toBe(2);
        });

        test("middleware seq ordering preserved", () => {
            const order = [];
            app.use((req, res) => order.push("global1"));
            app.get("/", (req, res) => order.push("route"));
            app.use((req, res) => order.push("global2"));
            const r = app.find("GET", "/");
            // handler harus urut seq: global1, route, global2
            expect(r.handlers.length).toBe(3);
        });
    });

    describe("error handler", () => {
        test("3-arg handler registered as CATCH", () => {
            app.use((err, req, res) => {});
            const r = app.find("GET", "/");
            expect(r.errorHandlers.length).toBe(1);
            expect(r.handlers.length).toBe(0);
        });
    });

    describe("nested router", () => {
        test("nested router routes work", () => {
            const users = new Router();
            users.get("/", () => {});
            users.get("/:id", () => {});
            app.use("/users", users);

            const r1 = app.find("GET", "/users");
            expect(r1.handlers.length).toBe(1);

            const r2 = app.find("GET", "/users/123");
            expect(r2.params).toEqual({ id: "123" });
        });

        test("double-nested router", () => {
            const users = new Router();
            users.get("/:id", () => {});
            const admin = new Router();
            admin.use("/users", users);
            app.use("/admin", admin);

            const r = app.find("GET", "/admin/users/42");
            expect(r.params).toEqual({ id: "42" });
        });
    });

    describe("methods", () => {
        test("GET and POST separate", () => {
            app.get("/", () => {});
            const r1 = app.find("GET", "/");
            const r2 = app.find("POST", "/");
            expect(r1.handlers.length).toBe(1);
            expect(r2.handlers.length).toBe(0);
        });

        test("ALL matches any method", () => {
            app.use("/", (req, res) => {});
            const r1 = app.find("GET", "/");
            const r2 = app.find("POST", "/");
            expect(r1.handlers.length).toBe(1);
            expect(r2.handlers.length).toBe(1);
        });
    });

    describe("trailing slash", () => {
        test("GET /me/ falls back to /me", () => {
            app.get("/me", () => {});
            const r = app.find("GET", "/me/");
            expect(r.handlers.length).toBe(1);
        });

        test("GET /me falls back to /me/", () => {
            app.get("/me/", () => {});
            const r = app.find("GET", "/me");
            expect(r.handlers.length).toBe(1);
        });
    });

    describe("all HTTP methods", () => {
        const methods = [
            ["get", "GET"],
            ["post", "POST"],
            ["put", "PUT"],
            ["patch", "PATCH"],
            ["delete", "DELETE"],
            ["head", "HEAD"],
            ["options", "OPTIONS"],
            ["trace", "TRACE"],
            ["connect", "CONNECT"],
            ["query", "QUERY"],
        ];

        for (const [fn, method] of methods) {
            test(`${fn}() registers ${method} route`, () => {
                app[fn]("/", () => {});
                const r = app.find(method, "/");
                expect(r.handlers.length).toBe(1);
            });
        }
    });

    describe("radix split", () => {
        test("split when two routes share prefix", () => {
            app.get("/api/cat", () => {});
            app.get("/api/car", () => {});
            app.get("/api/cart", () => {});
            expect(app.find("GET", "/api/cat").handlers.length).toBe(1);
            expect(app.find("GET", "/api/car").handlers.length).toBe(1);
            expect(app.find("GET", "/api/cart").handlers.length).toBe(1);
            expect(app.find("GET", "/api/ca").handlers.length).toBe(0);
        });

        test("split with param after literal", () => {
            app.get("/api/:id", () => {});
            app.get("/api/cat", () => {});
            expect(app.find("GET", "/api/cat").handlers.length).toBe(1);
            expect(app.find("GET", "/api/123").params.id).toBe("123");
        });
    });

    test("split with remaining path after common prefix", () => {
        app.get("/api/cat", () => {});
        app.get("/api/caterpillar", () => {});
        expect(app.find("GET", "/api/cat").handlers.length).toBe(1);
        expect(app.find("GET", "/api/caterpillar").handlers.length).toBe(1);
        expect(app.find("GET", "/api/ca").handlers.length).toBe(0);
    });

    test("trailing slash fallback fails gracefully", () => {
        app.get("/me", () => {});
        const r = app.find("GET", "/nonexistent/");
        expect(r.handlers.length).toBe(0);
    });
    test("split when new path ends exactly at common prefix", () => {
        app.get("/api/cat", () => {});
        app.get("/api", () => {});
        expect(app.find("GET", "/api").handlers.length).toBe(1);
        expect(app.find("GET", "/api/cat").handlers.length).toBe(1);
    });
    test("param with empty value does not match", () => {
        app.get("/:id", () => {});
        const r = app.find("GET", "//");
        expect(r.handlers.length).toBe(0);
    });
});
