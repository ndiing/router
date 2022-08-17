# [router](https://ndiing.github.io/router/)
router

### Install
```
npm install @ndiinginc/router
```

### Usage

```js

const Router = require('@ndiinginc/router')

// Create router
const router = new Router();

router.post("/", (req, res, next) => {
    res.json({ message: "from router post" });
});
router.get("/", (req, res, next) => {
    res.json({ message: "from router get" });
});
router.patch("/:id", (req, res, next) => {
    // get url object
    // get params
    // get query object
    // get cookies
    // get body

    // send cookie
    res.cookie("name", "value");

    // send cookie object
    res.cookie({
        name: "name1",
        value: "value1",
    });
    // send more..
    res.cookie({
        name: "name1",
        value: "value1",
    });

    // removing previouse cookie
    res.cookie("name");

    res.json({
        origin: req.origin,
        ip: req.ip,
        url2: req.url2,
        params: req.params,
        query: req.query,
        headers: req.headers,
        cookies: req.cookies,
        body: req.body,
    });
});
router.put("/:id", (req, res, next) => {
    res.json({ message: "from router put" });
});
router.delete("/:id", (req, res, next) => {
    res.json({ message: "from router delete" });
});

// Create app
const app = new Router();

// Using middleware
app.use((req, res, next) => {
    next();
});

// Register router
app.use("/router", router);

// Redirect
app.get("/redirect", (req, res, next) => {
    res.redirect("/");
});

// Add Get route
app.get("/", (req, res, next) => {
    res.json({ message: "from app get" });
});

// Send error
app.get("/catch-all", (req, res, next) => {
    throw new Error("error message");
});

// custom page not found
app.use((req, res, next) => {
    next({ message: "page not found" });
});

// custom catch-all
app.use((err, req, res, next) => {
    res.json({ err });
});

app.listen(3000);

```