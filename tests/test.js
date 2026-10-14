const { inspect } = require("node:util");
const App = require("../src");
const { Router } = require("../src/router");
const { parseQueryString } = require("../src/util");
const { cors } = require("../src/middleware/cors");

const auth = () => {
    const handler = (req, res) => {};
    return handler;
};

const shared = (req, res) => {};

const blogs = new Router();
blogs.get("/", (req, res) => res.json({}));
blogs.get("/:id", (req, res) => res.json({}));

const users = new Router();
users.get("/", (req, res) => res.json({}));
users.get("/:id", (req, res) => res.json({}));

const admin = new Router();
admin.use("/users", users);
admin.get("/", (req, res) => res.json({}));
admin.get("/:id", (req, res) => res.json({}));

const app = new App();
app.use("/blogs", auth(), shared, blogs);
app.use("/admin", auth(), shared, admin);
app.get("/", (req, res) => res.json({}));
app.get("/:id", (req, res) => res.json({}));

console.log(inspect(app, false, null, true));

console.log(app.find("GET", "/blogs"));
console.log(app.find("GET", "/admin"));

console.log();

console.log(parseQueryString("a=b"));
console.log(parseQueryString("a="));
console.log(parseQueryString("=b"));
console.log(parseQueryString("="));
console.log(parseQueryString("%=%"));
console.log(parseQueryString("=%"));
console.log(parseQueryString("%="));
console.log(parseQueryString("a=&a=b"));

console.log(new URLSearchParams("a=b"));
console.log(new URLSearchParams("a="));
console.log(new URLSearchParams("=b"));
console.log(new URLSearchParams("="));
console.log(new URLSearchParams("%=%"));
console.log(new URLSearchParams("=%"));
console.log(new URLSearchParams("%="));
console.log(new URLSearchParams("a=&a=b"));

console.log();

console.log(
    cors({
        origin: "*",
        methods: ["POST", "GET", "PATCH", "DELETE"],
        headers: ["x-requested-with"],
    })(
        {
            method: "OPTIONS",
            headers: {
                "access-control-request-method": "DELETE",
                "access-control-request-headers": "x-requested-with",
                origin: "https://www.example.com",
            },
        },
        {
            setHeader: console.log,
            end: console.log,
            appendHeader: console.log,
        },
    ),
);

console.log(
    cors({
        origin: ["https://www.example.com"],
        methods: ["POST", "GET", "PATCH", "DELETE"],
        headers: ["x-requested-with"],
    })(
        {
            method: "OPTIONS",
            headers: {
                "access-control-request-method": "DELETE",
                "access-control-request-headers": "x-requested-with",
                origin: "https://www.example.com",
            },
        },
        {
            setHeader: console.log,
            end: console.log,
            appendHeader: console.log,
        },
    ),
);

console.log(
    cors({
        origin: ["http://www.example.com"],
        methods: ["POST", "GET", "PATCH", "DELETE"],
        headers: ["x-requested-with"],
    })(
        {
            method: "OPTIONS",
            headers: {
                "access-control-request-method": "DELETE",
                "access-control-request-headers": "x-requested-with",
                origin: "https://www.example.com",
            },
        },
        {
            setHeader: console.log,
            end: console.log,
            appendHeader: console.log,
        },
    ),
);

console.log(
    cors({
        origin: ["http://www.example.com"],
        methods: ["POST", "GET", "PATCH", "DELETE"],
        headers: ["x-requested-with"],
    })(
        {
            headers: {},
        },
        {
            setHeader: console.log,
            end: console.log,
            appendHeader: console.log,
        },
    ),
);
