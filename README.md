# Install

```
npm install @ndiinginc/router
```


<!-- examples -->
### Examples
```js
// ./user.js// Create routerconst user = Router();// Create middlewareuser.use((req, res, next) => {    next();});// Create get middlewareuser.get("/", (req, res, next) => {    res.json({ message: "user get" });});// Create patch middlewareuser.patch("/:id", (req, res, next) => {    // res.cookie('name','value')//send cookie    // res.cookie('name')//remove previous cookie    res.json({        // headers:req.headers, // get request headers        // origin:req.origin, // get origin        ip:req.ip, // get ip        // url2:req.url2, // get url object        path:req.path, // get path        query:req.query, // get query object        params:req.params, // get params        // cookie:req.cookie, // get cookie    });});// ./router.js// Create routerconst router = Router();// Create middlewarerouter.use((req, res, next) => {    next();});// Register routerrouter.use('/user',user);// Create get middlewarerouter.get("/", (req, res, next) => {    res.json({ message: "router get" });});// ./index.js// Create appconst app = Router({    // body: null, // default body, set null/false to disable    security: null, // default security, set null/false to disable    compression: null, // default compression, set null/false to disable    cache: null, // default cache, set null/false to disable    cookie: null, // default cookie, set null/false to disable    limiter: null, // default limiter, set null/false to disable});// Create middlewareapp.use((req, res, next) => {    next();});// Register routerapp.use('/router',router);// Create get middlewareapp.get("/", (req, res, next) => {    res.json({ message: "app get" });});// Start serverapp.listen(3000, () => {    console.log(3000)});
```

<!-- examples -->

## Router

<!-- constructor -->
### Constructor
<dl>
    <dt><code><a href="./docs//router.md">Router()</a></code></dt>
    <dd></dd>
</dl>
<!-- constructor -->

<!-- properties -->
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
### Methods
<dl>
    <dt><code><a href="./docs/router/use.md">Router#use()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/connect.md">Router#connect()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/delete.md">Router#delete()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/get.md">Router#get()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/head.md">Router#head()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/options.md">Router#options()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/patch.md">Router#patch()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/post.md">Router#post()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/put.md">Router#put()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/trace.md">Router#trace()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/handle-request.md">Router#handleRequest()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/router/listen.md">Router#listen()</a></code></dt>
    <dd></dd>
</dl>
<!-- methods -->

<!-- staticmethods -->
<!-- staticmethods -->
