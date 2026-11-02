require("../src/polyfill");
const { Router, decodeParam } = require("../src/router");
const { Node } = require("../src/node");

/* =========================================================
 * 1. decodeParam
 * =======================================================*/
describe("decodeParam", () => {
    test("decode normal", () => {
        expect(decodeParam("%3Fx%3Dtest")).toBe("?x=test");
        expect(decodeParam("JavaScript_%D1%88%D0%B5%D0%BB%D0%BB%D1%8B")).toBe("JavaScript_шеллы");
    });
    test("catch invalid URI (fallback raw)", () => {
        expect(decodeParam("%E0%A4%A")).toBe("%E0%A4%A");
    });
    test("plus & space", () => {
        expect(decodeParam("search+query%20%28correct%29")).toBe("search+query (correct)");
    });
});

/* =========================================================
 * 2. Node (unit)
 * =======================================================*/
describe("Node", () => {
    test("prefix & name untuk param", () => {
        const n = new Node(":id");
        expect(n.prefix).toBe(":id");
        expect(n.name).toBe("id");
    });
    test("add param", () => {
        const root = new Node();
        const child = root.add(":id");
        expect(child.name).toBe("id");
        expect(root.params.get(":id")).toBe(child);
    });
    test("add wildcard (idempotent)", () => {
        const root = new Node();
        const a = root.add("*");
        const b = root.add("*");
        expect(a).toBe(b);
        expect(root.wildcard).toBe(a);
    });
    test("add static pakai char pertama sebagai key", () => {
        const root = new Node();
        const child = root.add("hello");
        expect(root.children.get("h")).toBe(child);
    });
    test("getMaxSeq default -1", () => {
        const root = new Node();
        expect(root.getMaxSeq()).toBe(-1);
    });
    test("getMaxSeq ambil max dari handlers", () => {
        const root = new Node();
        root.handlers.set("GET", [{ handler: () => {}, seq: 3 }]);
        root.handlers.set("POST", [{ handler: () => {}, seq: 7 }]);
        expect(root.getMaxSeq()).toBe(7);
    });
    test("getMaxSeq traverse wildcard/params/children", () => {
        const root = new Node();
        root.add("*").handlers.set("GET", [{ handler: () => {}, seq: 2 }]);
        root.add(":id").handlers.set("GET", [{ handler: () => {}, seq: 5 }]);
        root.add("abc").handlers.set("GET", [{ handler: () => {}, seq: 9 }]);
        expect(root.getMaxSeq()).toBe(9);
    });
});

/* =========================================================
 * 3. Router methods (smoke)
 * =======================================================*/
describe("router methods", () => {
    const router = new Router();
    router.get("/", () => {});
    router.query("/", () => {});
    router.head("/", () => {});
    router.options("/", () => {});
    router.trace("/", () => {});
    router.put("/", () => {});
    router.delete("/", () => {});
    router.post("/", () => {});
    router.patch("/", () => {});
    router.connect("/", () => {});

    for (const method of ["GET", "QUERY", "HEAD", "OPTIONS", "TRACE", "PUT", "DELETE", "POST", "PATCH", "CONNECT"]) {
        test(method.toLowerCase(), () => {
            const r = router.find(method, "/");
            expect(Object.keys(r.handlers).length).toBe(1);
        });
    }
});

/* =========================================================
 * 4. Static / params / wildcard (single router)
 * =======================================================*/
describe("router static/params/wildcard", () => {
    const router = new Router();
    router.get("/posts", () => {});
    router.get("/posts/:id", () => {});
    router.get("/posts/:postId/comments", () => {});
    router.get("/posts/me", () => {});
    router.get("/posts/*", () => {});
    router.use((err, req, res) => {});

    test("static", () => {
        const r = router.find("GET", "/posts");
        expect(Object.keys(r.handlers).length).toBe(1);
    });
    test("params", () => {
        const r = router.find("GET", "/posts/321");
        expect(Object.keys(r.handlers).length).toBe(1);
        expect(r.params.id).toBe("321");
    });
    test("another params", () => {
        const r = router.find("GET", "/posts/321/comments");
        expect(Object.keys(r.handlers).length).toBe(1);
        expect(r.params.postId).toBe("321");
    });
    test("another static (id undefined)", () => {
        const r = router.find("GET", "/posts/me");
        expect(Object.keys(r.handlers).length).toBe(1);
        expect(r.params.id === undefined).toBe(true);
    });
    test("wildcard", () => {
        const r = router.find("GET", "/posts/asdf/asdf/asdf");
        expect(Object.keys(r.handlers).length).toBe(1);
        expect(r.params.wildcard).toBe("asdf/asdf/asdf");
    });
    test("error handler collected di root", () => {
        const r = router.find("GET", "/posts");
        expect(Object.keys(r.errorHandlers).length).toBe(1);
    });
});

/* =========================================================
 * 5. Radix split
 * =======================================================*/
describe("radix router split", () => {
    test("split new (/abc lalu /abcd)", () => {
        const router = new Router();
        router.get("/abc", () => {});
        router.get("/abcd", () => {});
        expect(Object.keys(router.find("GET", "/abc").handlers).length).toBe(1);
        expect(Object.keys(router.find("GET", "/abcd").handlers).length).toBe(1);
    });
    test("split existing (/abcd lalu /ad)", () => {
        const router = new Router();
        router.get("/abcd", () => {});
        router.get("/ad", () => {});
        expect(Object.keys(router.find("GET", "/ad").handlers).length).toBe(1);
        expect(Object.keys(router.find("GET", "/abcd").handlers).length).toBe(1);
    });
});

/* =========================================================
 * 6. find fallback trailing slash
 * =======================================================*/
describe("find fallback", () => {
    test("match /posts/ ke /posts", () => {
        const posts = new Router();
        posts.get("/", () => {});
        const router = new Router();
        router.use("/posts", posts);
        router.get("/", () => {});
        expect(Object.keys(router.find("GET", "/posts/").handlers).length).toBe(1);
    });
    test("match /posts ke /posts/", () => {
        const posts = new Router();
        posts.get("/", () => {});
        const router = new Router();
        router.use("/posts", posts);
        router.get("/", () => {});
        expect(Object.keys(router.find("GET", "/posts").handlers).length).toBe(1);
    });
});

/* =========================================================
 * 7. Nested router — TERISOLASI (app hanya punya use)
 *    biar kalau gagal, pasti bug di merge/strip, bukan route app
 * =======================================================*/
describe("nested router (isolated)", () => {
    const posts = new Router();
    posts.get("/", () => {});
    posts.get("/:id", () => {});
    posts.get("/:postId/comments", () => {});
    posts.get("/me", () => {});
    posts.get("/*", () => {});

    const app = new Router();
    app.use("/posts", posts);

    test("nested static", () => {
        const r = app.find("GET", "/posts");
        expect(Object.keys(r.handlers).length).toBe(1);
    });
    test("nested params", () => {
        const r = app.find("GET", "/posts/321");
        expect(Object.keys(r.handlers).length).toBe(1);
        expect(r.params.id).toBe("321");
    });
    test("nested another params", () => {
        const r = app.find("GET", "/posts/321/comments");
        expect(Object.keys(r.handlers).length).toBe(1);
        expect(r.params.postId).toBe("321");
    });
    test("nested another static", () => {
        const r = app.find("GET", "/posts/me");
        expect(Object.keys(r.handlers).length).toBe(1);
        expect(r.params.id === undefined).toBe(true);
    });
    test("nested wildcard (prefix harus di-strip)", () => {
        const r = app.find("GET", "/posts/asdf/asdf/asdf");
        expect(Object.keys(r.handlers).length).toBe(1);
        expect(r.params.wildcard).toBe("asdf/asdf/asdf");
    });
});

/* =========================================================
 * 8. App own routes (tanpa nested) — pastikan tidak rusak
 * =======================================================*/
describe("app own routes", () => {
    const app = new Router();
    app.get("/", () => {});
    app.get("/:id", () => {});
    app.get("/:postId/comments", () => {});
    app.get("/me", () => {});
    app.get("/*", () => {});

    test("root", () => {
        const r = app.find("GET", "/");
        expect(Object.keys(r.handlers).length).toBe(1);
    });
    test("params 1 segmen", () => {
        const r = app.find("GET", "/321");
        expect(r.params.id).toBe("321");
    });
    test("params 2 segmen", () => {
        const r = app.find("GET", "/321/comments");
        expect(r.params.postId).toBe("321");
    });
    test("static menang dari param", () => {
        const r = app.find("GET", "/me");
        expect(r.params.id === undefined).toBe(true);
    });
    test("wildcard ambil sisa path", () => {
        const r = app.find("GET", "/a/b/c");
        expect(r.params.wildcard).toBe("a/b/c");
    });
});

/* =========================================================
 * 9. Coverage extras
 * =======================================================*/
describe("coverage extras", () => {
    test("use(handler) tanpa path -> error handler di root", () => {
        const r = new Router();
        r.use((err, req, res) => {});
        const res = r.find("GET", "/anything");
        expect(Object.keys(res.errorHandlers).length).toBe(1);
    });
    test("use(path, handler) -> handler ALL", () => {
        const r = new Router();
        r.use("/a", (req, res) => {});
        const res = r.find("GET", "/a");
        expect(Object.keys(res.handlers).length).toBe(1);
    });
    test("use multiple handler di path sama", () => {
        const r = new Router();
        r.use(
            "/a",
            (req, res) => {},
            (req, res) => {},
        );
        const res = r.find("GET", "/a");
        expect(Object.keys(res.handlers).length).toBe(2);
    });
    test("nested params merge (child saja)", () => {
        const child = new Router();
        child.get("/:id", () => {});
        const parent = new Router();
        parent.use("/p", child);
        const r = parent.find("GET", "/p/123");
        expect(r.params.id).toBe("123");
    });
    test("tidak match sama sekali -> matched false, params default", () => {
        const r = new Router();
        r.get("/x", () => {});
        const res = r.find("GET", "/y");
        expect(Object.keys(res.handlers).length).toBe(0);
        expect(res.params).toEqual({});
    });
    test("decode param di URL", () => {
        const r = new Router();
        r.get("/p/:name", () => {});
        const res = r.find("GET", "/p/hello%20world");
        expect(res.params.name).toBe("hello world");
    });
    test("seq order antar handler", () => {
        const r = new Router();
        r.use("/x", (req, res) => {});
        r.get("/x", (req, res) => {});
        const res = r.find("GET", "/x");
        const keys = Object.keys(res.handlers).map(Number);
        expect(keys).toEqual([...keys].sort((a, b) => a - b));
        expect(keys.length).toBe(2);
    });
    test("requestTimeout default 0", () => {
        expect(new Router().requestTimeout).toBe(0);
        expect(new Router({ requestTimeout: 500 }).requestTimeout).toBe(500);
    });
});

test("search params value kosong (path mulai /)", () => {
    const r = new Router();
    r.get("/:id", () => {});
    // setelah root.children["/"], path sisa = "" -> params loop dilewati
    // coba path yang bikin value = "" di node params
    const res = r.find("GET", "/");
    // asal tidak crash & tidak match ke :id
    expect(res.params.id).toBe(undefined);
});

test("search partial match -> state nyimpen best", () => {
    const r = new Router();
    r.get("/a/b", () => {});
    // /a match partial (node "/a" ada), tapi nggak sampai handler
    const res = r.find("GET", "/a/c");
    expect(Object.keys(res.handlers).length).toBe(0);
});

test("wildcard via use (ALL) bukan method", () => {
    const r = new Router();
    r.use("/*", (req, res) => {});
    const res = r.find("GET", "/anything");
    expect(res.params.wildcard).toBe("anything");
});

test("path tanpa trailing slash -> fallback tambah /", () => {
    const posts = new Router();
    posts.get("/", () => {});
    const r = new Router();
    r.use("/posts", posts);
    expect(Object.keys(r.find("GET", "/posts").handlers).length).toBe(1);
});

test("path dengan trailing slash -> fallback buang /", () => {
    const posts = new Router();
    posts.get("/", () => {});
    const r = new Router();
    r.use("/posts", posts);
    expect(Object.keys(r.find("GET", "/posts/").handlers).length).toBe(1);
});

describe("nested router (extended)", () => {
    test("nested method berbeda", () => {
        const api = new Router();
        api.get("/users", () => {});
        api.post("/users", () => {});
        api.delete("/users/:id", () => {});

        const app = new Router();
        app.use("/api", api);

        expect(Object.keys(app.find("GET", "/api/users").handlers).length).toBe(1);
        expect(Object.keys(app.find("POST", "/api/users").handlers).length).toBe(1);
        expect(Object.keys(app.find("DELETE", "/api/users/123").handlers).length).toBe(1);
        expect(app.find("DELETE", "/api/users/123").params.id).toBe("123");
    });

    test("nested use(mw) jalan", () => {
        const calls = [];
        const api = new Router();
        api.use((req, res) => {
            calls.push("api-mw");
        });
        api.get("/users", () => {
            calls.push("api-handler");
        });

        const app = new Router();
        app.use("/api", api);

        const res = app.find("GET", "/api/users");
        expect(Object.keys(res.handlers).length).toBe(2); // mw + handler
    });

    test("nested multi-level", () => {
        const v1 = new Router();
        v1.get("/users", () => {});

        const api = new Router();
        api.use("/v1", v1);

        const app = new Router();
        app.use("/api", api);

        expect(Object.keys(app.find("GET", "/api/v1/users").handlers).length).toBe(1);
    });

    test("nested error handler", () => {
        const api = new Router();
        api.get("/users", () => {
            throw new Error("boom");
        });
        api.use((err, req, res) => {});

        const app = new Router();
        app.use("/api", api);

        const res = app.find("GET", "/api/users");
        expect(Object.keys(res.errorHandlers).length).toBe(1);
    });

    test("nested use di path sama", () => {
        const api = new Router();
        api.use("/x", () => {});
        api.use("/x", () => {});
        api.get("/x", () => {});

        const app = new Router();
        app.use("/api", api);

        const res = app.find("GET", "/api/x");
        expect(Object.keys(res.handlers).length).toBe(3); // 2 mw + handler
    });

    test("nested router route sendiri (app) tetap jalan", () => {
        const api = new Router();
        api.get("/users", () => {});

        const app = new Router();
        app.use("/api", api);
        app.get("/api/health", () => {}); // ← app punya route sendiri di bawah /api

        expect(Object.keys(app.find("GET", "/api/users").handlers).length).toBe(1);
        expect(Object.keys(app.find("GET", "/api/health").handlers).length).toBe(1);
    });
});

test("nested + app route yang share prefix", () => {
    const api = new Router();
    api.get("/users", () => {});

    const app = new Router();
    app.use("/api", api);
    app.get("/api", () => {}); // ← app route di /api
    app.get("/api/v2/health", () => {}); // ← app route lebih dalam

    expect(Object.keys(app.find("GET", "/api/users").handlers).length).toBe(1);
    expect(Object.keys(app.find("GET", "/api").handlers).length).toBe(1);
    expect(Object.keys(app.find("GET", "/api/v2/health").handlers).length).toBe(1);
});
