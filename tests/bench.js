const App = require("../src/index");

function bench(title, callback) {
    console.log(title);
    for (let index = 0; index < 1_000; index++) {
        callback();
    }
    const start = performance.now();
    for (let index = 0; index < 1_000_000; index++) {
        callback();
    }
    const end = performance.now();
    const duration = (end - start) / 1000;
    console.log(duration.toFixed(3) + "s");
}

const blogs = new App();
blogs.get("/", (req, res) => res.json());
blogs.get("/:id", (req, res) => res.json());

const app = new App();
app.use('/blogs',blogs)
app.get("/", (req, res) => res.json());
app.get("/:id", (req, res) => res.json());

bench("search", () => {
    // app.search('GET','/')
    // app.search("GET", "/321");
    app.search("GET", "/blogs/321");
});
bench("find", () => {
    // app.find('GET','/')
    // app.search("GET", "/321");
    app.search("GET", "/blogs/321");
});
