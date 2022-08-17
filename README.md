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
    console.log(req.url2);
    // get params
    console.log(req.params);
    // get query object
    console.log(req.query);
    // get cookies
    console.log(req.cookies);
    // get body
    console.log(req.body);

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

    res.json({ message: "from router patch" });
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
    console.log("app middleware");
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

// /test.rest
// ###
// GET http://localhost:3000
// ###
// GET http://localhost:3000/router
// ###
// POST http://localhost:3000/router
// ###
// PATCH http://localhost:3000/router/1?user=name&pass=word
// Content-Type: application/json
// Cookie: name=value; name1=value1; name3=value3

// {"user":"name"}
// ###
// GET http://localhost:3000/redirect
// ###
// GET http://localhost:3000/not-found
// ###
// GET http://localhost:3000/catch-all

```