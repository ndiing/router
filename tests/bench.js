
const { Router } = require("../src/index");

const router = new Router();
router.get("/", (req, res) => res.json({}));

const res = router.search("GET", "/");

function bench(title, callback) {
    for (let i = 0; i < 10_000; i++) callback();

    const start = performance.now();

    for (let i = 0; i < 1_000_000; i++) callback();

    console.log(
        title,
        ((performance.now() - start) / 1000).toFixed(3) + "s"
    );
}

// bench("search", () => {
//     router.search("GET", "/");
// });

// bench("find", () => {
//     router.find("GET", "/");
// });

// bench("object values", () => {
//     const handlers = {};
//     handlers[0] = () => {};
//     Object.values(handlers);
// });

// bench("array allocation", () => {
//     const handlers = [];
//     handlers.push(() => {});
// });

