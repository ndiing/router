const { inspect } = require("node:util");
const App = require("../src");
const { Router, json, cors } = App;

// const req = {
//     method: "OPTIONS",
//     headers: {
//         "access-control-request-method": "GET",
//         "access-control-request-headers": "content-type,x-requested-with",
//         origin: "https://www.example.com",
//     },
// };
// const res = {
//     setHeader: console.log,
//     appendHeader: console.log,
//     end: console.log,
// };

// console.log(cors({ origin: "*" })(req, res));
// console.log(cors({ origin: null })(req, res));
// console.log(cors({ origin: undefined })(req, res));
// console.log(cors({ origin: "http://localhost" })(req, res));

// console.log(cors({ origin: "*", credentials: true })(req, res));
// console.log(cors({ origin: "*", credentials: false })(req, res));

// console.log(cors({ origin: "*", credentials: true, headers: "*" })(req, res));
// console.log(cors({ origin: "*", credentials: true, headers: ["Content-Encoding", "Kuma-Revision"] })(req, res));

/* 
Content-Security-Policy	Batasi sumber resource (script, style, img)
Strict-Transport-Security	Paksa HTTPS
X-Frame-Options	Cegah clickjacking (iframe)
X-Content-Type-Options	Cegah MIME sniffing
Referrer-Policy	Atur info referrer
Permissions-Policy	Batasi fitur browser (kamera, mikrofon)
Cross-Origin-Opener-Policy	Isolasi browsing context
Cross-Origin-Resource-Policy	Batasi resource di-load cross-origin
X-DNS-Prefetch-Control	Kontrol DNS prefetch
X-Download-Options	(IE) cegah download otomatis
X-Permitted-Cross-Domain-Policies	(Flash/PDF)
*/

const blogs = new Router();
blogs.use((req) => {
    /* middleware */
});
blogs.post("/", json(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
blogs.get("/:id", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
blogs.get("/", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
blogs.patch("/:id", json(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
blogs.delete("/:id", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));

const users = new Router();
users.use((req) => {
    /* middleware */
});
users.post("/", json(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
users.get("/:id", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
users.get("/", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
users.patch("/:id", json(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
users.delete("/:id", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));

const admin = new Router();
admin.use((req) => {
    /* middleware */
});
admin.use("/users", users);
admin.post("/", json(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
admin.get("/:id", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
admin.get("/", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
admin.patch("/:id", json(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
admin.delete("/:id", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));

const asdf3 = new Router();
asdf3.get("/:id", (req, res) => res.json({}));

const asdf2 = new Router();
asdf2.use("/asdf3", asdf3);

const asdf1 = new Router();
asdf1.use("/asdf2", asdf2);

const qwerty3 = new Router();

const qwerty2 = new Router();
qwerty2.use("/qwerty3", qwerty3);
qwerty2.get("/:id", (req, res) => res.json({}));

const qwerty1 = new Router();
qwerty1.use("/qwerty2", qwerty2);

const app = new App();
app.use((req) => {
    /* middleware */
});
app.use("/blogs", blogs);
app.use("/admin", admin);
app.use("/asdf1", asdf1);
app.use("/qwerty1", qwerty1);
app.post("/", json(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
app.get("/:id", async (req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 60_000));
    res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body });
});
app.get("/", cors(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
app.patch("/:id", json(), (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
app.delete("/:id", (req, res) => res.json({ method: req.method, path: req.path, params: req.params, query: req.query, body: req.body }));
app.use((req, res) => {
    res.statusCode = 404;
    throw new Error("Tidak Ditemukan");
});
app.use((err, req, res) => {
    const error = {
        status: res.statusCode, // indicate custom
        message: err.message,
        stack: err.stack,
    };
    res.json({ error });
});

// console.log(inspect(app, false, null, true));

// console.log(app.find("GET", "/"));
// console.log(app.find("GET", "/321"));
// console.log(app.find("GET", "/blogs/"));
// console.log(app.find("GET", "/blogs/321"));
// console.log(app.find("GET", "/admin/"));
// console.log(app.find("GET", "/admin/321"));
// console.log(app.find("GET", "/admin/users/"));
// console.log(app.find("GET", "/admin/users/321"));
// console.log(app.find("GET", "/not/found/"));
// console.log(app.find("GET", "/not/found/321"));

// const server = app.listen(0);
// const port = server.address().port;
// const base = `http://localhost:${port}`;

// fetch(`${base}/`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);

// fetch(`${base}/?user=name&pass=word`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: "name", pass: "word" }) })
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/321`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/blogs/`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/blogs/?user=name&pass=word`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/blogs/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: "name", pass: "word" }) })
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/blogs/321`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/admin/`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/admin/?user=name&pass=word`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/admin/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: "name", pass: "word" }) })
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/admin/321`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/admin/users/`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/admin/users/?user=name&pass=word`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/admin/users/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: "name", pass: "word" }) })
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/admin/users/321`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/not/found/`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/not/found/?user=name&pass=word`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/not/found/`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: "name", pass: "word" }) })
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);
// fetch(`${base}/not/found/321`)
//     // .then((res) => res.json())
//     .then(console.log)
//     .catch(console.error);

// {
//     const app = require("express")();
//     app.get("/", (req, res) => res.json({ user: "name" }));
//     app.listen(3001);
// }
// {
//     const app = require("fastify")();
//     app.get("/", (req, res) => res.send({ user: "name" }));
//     app.listen({ port: 3002 });
// }
// {
//     const app = new App();
//     app.get("/", (req, res) => res.json({ user: "name" }));
//     app.listen(3003);
// }
// {
//     const { router, server } = require("0http")({ router: require("0http/lib/router/trie")() });
//     router.get("/", (req, res) => {
//         res.setHeader("Content-Type", "application/json");
//         res.end(JSON.stringify({ user: "name" }));
//     });
//     server.listen(3004);
// }

/*

autocannon -c 100 -d 40 -p 10 localhost:3001
autocannon -c 100 -d 40 -p 10 localhost:3002
autocannon -c 100 -d 40 -p 10 localhost:3003
autocannon -c 100 -d 40 -p 10 localhost:3004

autocannon -c 100 -d 1 -p 10 localhost:3001
autocannon -c 100 -d 1 -p 10 localhost:3002
autocannon -c 100 -d 1 -p 10 localhost:3003
autocannon -c 100 -d 1 -p 10 localhost:3004

*/

// function bench(label, fn, iterations = 1_000_000, runs = 10) {
//     // warm-up dulu biar JIT optimize
//     for (let w = 0; w < 3; w++) fn(iterations);

//     const times = [];
//     for (let r = 0; r < runs; r++) {
//         const start = performance.now();
//         fn(iterations);
//         times.push(performance.now() - start);
//     }

//     const avg = times.reduce((a, b) => a + b, 0) / runs;
//     const min = Math.min(...times);
//     const max = Math.max(...times);
//     console.log(`${label}: avg=${avg.toFixed(2)}ms min=${min.toFixed(2)}ms max=${max.toFixed(2)}ms`);
//     return { avg, min, max };
// }
// const a = bench("reg", (n) => {
//     for (let i = 0; i < n; i++) {
//         parseUrl("/");
//         parseUrl("/api/sidiva");
//         parseUrl("/api/sidiva?user=name");
//         parseUrl("/api/sidiva?user=name#pass");
//         parseUrl("/api/sidiva#pass");
//     }
// });

// const b = bench("url", (n) => {
//     for (let i = 0; i < n; i++) {
//         URL.parse("/", "http://127.0.0");
//         URL.parse("/api/sidiva", "http://127.0.0");
//         URL.parse("/api/sidiva?user=name", "http://127.0.0");
//         URL.parse("/api/sidiva?user=name#pass", "http://127.0.0");
//         URL.parse("/api/sidiva#pass", "http://127.0.0");
//     }
// });

// console.log(`\nreg vs url: ${(a.avg / b.avg).toFixed(2)}x`);

// const {parseUrl,parseQueryString} = require('../src/util')
// // console.log(parseQueryString('='))
// // console.log(parseQueryString('=%'))
// // console.log(parseQueryString('name='))
// console.log(parseQueryString('na%6De=value'))
// console.log(new URLSearchParams('na%6De=value'))