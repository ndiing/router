const App = require("../src/app");

const app = new App();
app.get("/", (req, res) => res.json({ user: "name" }));

const server = app.listen({ port: 3000 }, () => {
    console.log(server.address());
});
