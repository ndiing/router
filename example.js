const Router = require("./index");

// by default set
// - url parser
// - params parser
// - query parser
// - security headers & cors
// - cookie parser
// - body parser
// - compression

// ./api/book/index.js
const book = new Router();
book.get("/", (req, res, next) => {
    res.json({ message: "this from api/book get" });
});

// ./index.js
// Create app
const app = new Router();

// Using middleware
app.use((req,res,next) => {
    // remove header name
    // headers name are case insensitif
    res.headers.delete('x-powered-by')
    // res.headers.delete('X-Powered-By')
    next()
})

// Register router
app.use("/api/book", book);

// GET http://localhost:3000/
app.get("/", (req, res, next) => {
    res.json({ message: "this message from app get" });
});
// PATCH http://localhost:3000/?name=a&name=b&name=c&group=band
app.patch("/:id", (req, res, next) => {
    // get request url
    console.log(req.url2);
    // get request path
    console.log(req.path);
    // get request params
    console.log(req.params);
    // get request query
    console.log(req.query);
    // get request cookie
    console.log(req.cookies);
    // get request headers
    console.log(req.headers);
    // get request data
    console.log(req.body);

    // set response status
    // it will set something like
    // HTTP/1.1 201 Created
    res.status=201

    // send cookie
    res.cookie("name", "value");
    
    // send another cookies
    res.cookie("name1", "value1");
    res.cookie("name2", "value2");
    res.cookie("name3", "value3");
    res.cookie("andmore", "andmore");

    // remove previous cookie, just remove value
    // it will send
    // Set-Cookie: name=value,name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0
    res.cookie("name");

    // // send text/
    // res.send('this message from app patch')

    // send json
    res.json({ message: "this message from app patch" });
});

// Start server
const server = app.listen(3000, () => {
    console.log(server.address());
});
