// const App = require("../src");
// const http = require("http");
// const https = require("https");
// const fs = require("fs");
// const path = require("path");
// const { Request: IncomingMessage, Response: ServerResponse } = App;
// const { generateRootCA } = require("@ndiinginc/cert");

// const app = new App();

// app.post("/", (req, res) => res.json({}));
// app.get("/", (req, res) => {
//     console.log(req.ip);
//     res.json({});
// });

// // const {certificate:cert,privateKey:key} = generateRootCA('localhost')

// // fs.writeFileSync(path.resolve('tests','cert.pem'),cert)
// // fs.writeFileSync(path.resolve('tests','key.pem'),key)
// const cert = fs.readFileSync(path.resolve("tests", "cert.crt"));
// const key = fs.readFileSync(path.resolve("tests", "key.crt"));

// const httpServer = http.createServer({ IncomingMessage, ServerResponse }, (req, res) => app.handle(req, res));
// const httpsServer = https.createServer({ IncomingMessage, ServerResponse, cert, key }, (req, res) => app.handle(req, res));

// httpServer.listen(80, () => console.log(httpServer.address()));
// httpsServer.listen(443, () => console.log(httpsServer.address()));

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// fetch("http://localhost");
// // .then(console.log)
// // .catch(console.log)
// fetch("https://localhost");
// // .then(console.log)
// // .catch(console.log)
