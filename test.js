const { Console } = require("console");
var { Router } = require("./index");

// Initialize routes with class Router([/* routes */])

var routerA = new Router([
    {
        callback: (req, res, next) => {
            next();
        },
    },
    {
        method: "GET",
        path: "/",
        callback: (req, res, next) => {
            res.json({ message: "from routerA" });
        },
    },
    {
        method: "PATCH",
        path: "/:id",
        callback: async (req, res, next) => {
            console.log(req.url); // get url info
            console.log(req.url.searchParams); // get searchParams/query string as object
            console.log(req.params); // get path params
            console.log(req.cookies); // get cookies
            console.log(await req.json()); // get body as json
            res.cookie("name1", "value1"); // set cookie
            res.cookie({ name: "name2", value: "value2" }); // set cookie with object
            res.cookie("name1"); // remove previous cookie`
            res.json({ message: "from routerA" });
        },
    },
]);

var router1 = new Router([
    {
        callback: (req, res, next) => {
            next();
        },
    },
    { path: "/routerA", callback: routerA },
    {
        method: "GET",
        path: "/",
        callback: (req, res, next) => {
            res.json({ message: "from router1" });
        },
    },
]);

var app = new Router([
    {
        callback: (req, res, next) => {
            next();
        },
    },
    { path: "/router1", callback: router1 },
    {
        method: "GET",
        path: "/",
        callback: (req, res, next) => {
            res.json({ message: "from app" });
        },
    },
    {
        method: "GET",
        path: "/error",
        callback: (req, res, next) => {
            throw new Error("test error message");
        },
    },
    {
        callback: (req, res, next) => {
            next({ message: "page not found" });
        },
    },
    {
        callback: (err, req, res, next) => {
            res.json({ err });
        },
    },
]);

app.listen(6666);

// or Intialize routes with express like style

var Router = require("./index");

var routerA = Router();
routerA.use((req, res, next) => {
    next();
});
routerA.get("/", (req, res, next) => {
    res.json({ message: "from routerA" });
});
routerA.patch("/:id", async (req, res, next) => {
    console.log(req.url); // get url info
    console.log(req.url.searchParams); // get searchParams/query string as object
    console.log(req.params); // get path params
    console.log(req.cookies); // get cookies
    console.log(await req.json()); // get body as json
    res.cookie("name1", "value1"); // set cookie
    res.cookie({ name: "name2", value: "value2" }); // set cookie with object
    res.cookie("name1"); // remove previous cookie`
    res.json({ message: "from routerA" });
});

var router1 = Router();
router1.use((req, res, next) => {
    next();
});
router1.use("/routerA", routerA);
router1.get("/", (req, res, next) => {
    res.json({ message: "from router1" });
});

var app = Router();
app.use((req, res, next) => {
    next();
});
app.use("/router1", router1);
app.get("/", (req, res, next) => {
    res.json({ message: "from app" });
});
app.get("/error", (req, res, next) => {
    throw new Error("test error message");
});
app.use((req, res, next) => {
    next({ message: "page not found" });
});
app.use((err, req, res, next) => {
    res.json({ err });
});

app.listen(5555);

// both technique are the same result
