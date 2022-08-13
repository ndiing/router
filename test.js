const Router = require('./index')

// @test
const routerA = new Router();
routerA.use((req, res, next) => {
    next();
});
routerA.get("/", (req, res, next) => {
    res.json({ message: "routerA get" });
});
routerA.patch("/:id", (req, res, next) => {
    res.cookie("name", "value");
    res.cookie({
        name: "name",
        value: "value",
    });
    res.cookie("name");
    res.json({
        path: req.path,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
        body: req.body,
        message: "routerA patch",
    });
});

const router2 = new Router();
router2.use((req, res, next) => {
    next();
});
router2.use("/routerA", routerA);
router2.get("/", (req, res, next) => {
    res.json({ message: "router2 get" });
});

const router1 = new Router();
router1.use((req, res, next) => {
    next();
});
router1.get("/", (req, res, next) => {
    res.json({ message: "router1 get" });
});

const app = new Router();
app.use((req, res, next) => {
    next();
});
app.use("/router1", router1);
app.use("/router2", router2);
app.get("/", (req, res, next) => {
    res.json({ message: "app get" });
});
app.get("/error", (req, res, next) => {
    throw new Error("message");
});
app.use((req, res, next) => {
    next({ message: "custom not found" });
});
app.use((err, req, res, next) => {
    // custom error
    res.json({ err });
});

app.listen(3000, () => {
    console.log('app listen on port 3000')
});

// var req = { method: "GET", url: "/book" };
// var res = { json: console.log, end: console.log };
// app.requestListener(req, res);
