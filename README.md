# [router](https://ndiing.github.io/router/)
router

### Install
```
npm install @ndiinginc/router
```

### Usage

```js

// Create routerA
const routerA = new Router();

// Using chain method
routerA
    .use((req, res, next) => {
        next();
    })
    .get("/", (req, res, next) => {
        res.json({ message: "routerA get" });
    })
    .post("/", (req, res, next) => {
        res.json({ message: "routerA post" });
    })
    .patch("/:id", (req, res, next) => {
        res.json({
            origin: req.origin,
            ip: req.ip,
            url2: req.url2,
            path: req.path,
            query: req.query,
            params: req.params,
            cookie: req.cookie,
            body: req.body,
            status: res.status,
        });
    })
    .delete("/:id", (req, res, next) => {
        res.json({ message: "routerA delete" });
    });

// Create router1
const router1 = new Router();
router1.use((req, res, next) => {
    next();
});

// Register routerA to router1
router1.use("/routerA", routerA);
router1.get("/", (req, res, next) => {
    res.json({ message: "router1 get" });
});

// Create app
const app = new Router({
    // useDefaultBodyParser
    // useDefaultSecurity
    // useDefaultCompression
    // useDefaultCaching
    // useDefaultCookieParser
    // useDefaultLimiter
    // useDefaultRoute
    // useDefaultErrorHandler
});
app.use((req, res, next) => {
    next();
});

// Register router1 to app
app.use("/router1", router1);
app.get("/", (req, res, next) => {
    res.json({ message: "app get" });
});

// Test error
app.get("/internal-server-error", (req, res, next) => {
    throw new Error("internal-server-error");
});

// Custom default route
app.use((req, res, next) => {
    res.status = 404;
    next({ message: "page not found" });
});

// Custom error handler
app.use((err, req, res, next) => {
    if (err && typeof err == "object") {
        err = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
    res.status = res.status == 200 ? 500 : res.status;
    res.json({ err });
});

// Start server
app.listen(3000);

```