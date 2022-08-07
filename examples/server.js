const http = require("http");
const { Router } = require("./index.js");

var router1 = new Router([
    // create middleware for router1
    {
        callback: (req, res, next) => {
            next();
        },
    },
    // create middleware for router1
    // one or more callback
    // using array
    {
        callback: [
            (req, res, next) => {
                next();
            },
            (req, res, next) => {
                next();
            },
        ],
    },
    // create get method with path / on router1
    {
        method: "GET",
        path: "/",
        callback: (req, res, next) => {
            res.json({ message: "from router1 get" });
        },
    },
]);

var router2 = new Router([
    // create middleware for router2
    {
        callback: (req, res, next) => {
            next();
        },
    },
    // create middleware for router2
    // one or more callback
    // using array
    {
        callback: [
            (req, res, next) => {
                next();
            },
            (req, res, next) => {
                next();
            },
        ],
    },
    // create POST method with path / on router2
    {
        method: "POST",
        path: "/",
        callback: (req, res, next) => {
            res.json({ message: "from router2 POST" });
        },
    },
    // create PATCH method with path / on router2
    {
        method: "PATCH",
        path: "/:id", // :id = /router2/1 = {id:1}
        callback: (req, res, next) => {
            console.log({
                body: req.body,
                url: req.url,
                params: req.params,
                query: req.query,
                cookies: req.cookies,
            });
            // send cookie
            res.cookie('name1','name1')
            // send more cookie
            res.cookie('name2','name2')
            // or using object
            res.cookie({
                name:'name3',
                value:'value3',
                expires: new Date(Date.now()+1000*60*60*24*12)
            })
            // remove previous cookie
            res.cookie('name1')
            res.json({ message: "from router2 PATCH" });
        },
    },
    // create PUT method with path / on router2
    {
        method: "PUT",
        path: "/:id", // :id = /router2/1 = {id:1}
        callback: (req, res, next) => {
            res.json({ message: "from router2 PUT" });
        },
    },
    // create DELETE method with path / on router2
    {
        method: "DELETE",
        path: "/:id", // :id = /router2/1 = {id:1}
        callback: (req, res, next) => {
            res.json({ message: "from router2 DELETE" });
        },
    },
]);

var app = new Router([
    // create middleware for app
    {
        callback: (req, res, next) => {
            next();
        },
    },
    // register router1
    // and router2
    {
        path: "/router1",
        callback: router1,
    },
    {
        path: "/router2",
        callback: router2,
    },
    // create get method with path / on app
    {
        method: "GET",
        path: "/",
        callback: (req, res, next) => {
            res.json({ message: "from app get" });
        },
    },
    // error somehow
    {
        method: "GET",
        path: "/error",
        callback: (req, res, next) => {
            throw new Error("Oppps...");
            res.json({ message: "from app get" });
        },
    },
    // create default route for app
    {
        callback: (req, res, next) => {
            res.status = 404;
            next({ message: "empty" });
        },
    },
    // create default error for app
    {
        callback: (err, req, res, next) => {
            res.status == 200 ? (res.status = 500) : res.status;
            res.json(err);
        },
    },
]);

http.createServer(app.requestListener).listen(5555);
