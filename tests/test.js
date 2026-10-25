const { inspect } = require("node:util");
const { Router } = require("../src/index");
const App = require("../src/index");

const blogs = new Router();
blogs.post("/", (req, res) => res.json({})); // <-
blogs.post("/:id", (req, res) => res.json({})); // <-

const app = new App();
app.post("/blogs", blogs);
app.post("/", (req, res) => res.json({}));

console.log(inspect(app, false, null, true));
console.log(app.find("POST", "/blogs")); // <-
console.log(app.find("POST", "/blogs/")); // <-
