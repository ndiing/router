# router


### Install
```
npm install @ndiinginc/router
```

### Index
- Router

    <!-- properties -->
    <!-- properties -->
    <!-- staticproperties -->
    <!-- staticproperties -->
    <!-- methods -->
    - Methods
        - [`Router#use`](#astnode100001118)
        - [`Router#connect`](#astnode100001134)
        - [`Router#delete`](#astnode100001150)
        - [`Router#get`](#astnode100001166)
        - [`Router#head`](#astnode100001182)
        - [`Router#options`](#astnode100001198)
        - [`Router#patch`](#astnode100001214)
        - [`Router#post`](#astnode100001230)
        - [`Router#put`](#astnode100001246)
        - [`Router#trace`](#astnode100001262)
        - [`Router#handleRequest`](#astnode100001503)
        - [`Router#listen`](#astnode100001864)
    <!-- methods -->
    <!-- staticmethods -->
    <!-- staticmethods -->
    <!-- events -->
    <!-- events -->

# Router
<!--  -->


<!-- examples -->
### Examples

```js
// ./user.js// Create routerconst user = Router();// Create middlewareuser.use((req, res, next) => {    next();});// Create get middlewareuser.get("/", (req, res, next) => {    res.json({ message: "user get" });});// Create patch middlewareuser.patch("/:id", (req, res, next) => {    // res.cookie('name','value')//send cookie    // res.cookie('name')//remove previous cookie    res.json({        // headers:req.headers, // get request headers        // origin:req.origin, // get origin        ip:req.ip, // get ip        // url2:req.url2, // get url object        path:req.path, // get path        query:req.query, // get query object        params:req.params, // get params        // cookie:req.cookie, // get cookie    });});// ./router.js// Create routerconst router = Router();// Create middlewarerouter.use((req, res, next) => {    next();});// Register routerrouter.use('/user',user);// Create get middlewarerouter.get("/", (req, res, next) => {    res.json({ message: "router get" });});// ./index.js// Create appconst app = Router({    // body: null, // default body, set null/false to disable    security: null, // default security, set null/false to disable    compression: null, // default compression, set null/false to disable    cache: null, // default cache, set null/false to disable    cookie: null, // default cookie, set null/false to disable    limiter: null, // default limiter, set null/false to disable});// Create middlewareapp.use((req, res, next) => {    next();});// Register routerapp.use('/router',router);// Create get middlewareapp.get("/", (req, res, next) => {    res.json({ message: "app get" });});// Start serverapp.listen(3000, () => {    console.log(3000)});
```

<!-- examples -->


<!-- constructor -->
### Constructor

<div><a href="./docs/astnode100000056.md" name="astnode100000056"><code>Router(config)</code></a></div>


<!-- constructor -->

<!-- properties -->
<!-- properties -->
<!-- staticproperties -->
<!-- staticproperties -->
<!-- methods -->
### Methods

<div><a href="./docs/astnode100001118.md" name="astnode100001118"><code>Router#use(args)</code></a></div>


<div><a href="./docs/astnode100001134.md" name="astnode100001134"><code>Router#connect(args)</code></a></div>


<div><a href="./docs/astnode100001150.md" name="astnode100001150"><code>Router#delete(args)</code></a></div>


<div><a href="./docs/astnode100001166.md" name="astnode100001166"><code>Router#get(args)</code></a></div>


<div><a href="./docs/astnode100001182.md" name="astnode100001182"><code>Router#head(args)</code></a></div>


<div><a href="./docs/astnode100001198.md" name="astnode100001198"><code>Router#options(args)</code></a></div>


<div><a href="./docs/astnode100001214.md" name="astnode100001214"><code>Router#patch(args)</code></a></div>


<div><a href="./docs/astnode100001230.md" name="astnode100001230"><code>Router#post(args)</code></a></div>


<div><a href="./docs/astnode100001246.md" name="astnode100001246"><code>Router#put(args)</code></a></div>


<div><a href="./docs/astnode100001262.md" name="astnode100001262"><code>Router#trace(args)</code></a></div>


<div><a href="./docs/astnode100001503.md" name="astnode100001503"><code>Router#handleRequest(req,res)</code></a></div>


<div><a href="./docs/astnode100001864.md" name="astnode100001864"><code>Router#listen(port,hostname,backlog)</code></a></div>


<!-- methods -->
<!-- staticmethods -->
<!-- staticmethods -->
<!-- events -->
<!-- events -->

