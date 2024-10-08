const Router = require("./index.js");

const app = new Router();

app.get("/", (req, res) => {
    res.json({ message: "ok" });
});

app.listen(3000);

// fetch('http://localhost:3000')
// .then(res=>res.json())
// .then(console.log)
// .catch(console.log)
