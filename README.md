<a name="module_router"></a>

## router
### Install```npm install @ndiing/router```### Usage```jsconst routerA = new Router();routerA.use((req, res, next) => {    next();});routerA.get("/", (req, res, next) => {    res.json({ message: "routerA get" });});routerA.patch("/:id", (req, res, next) => {    res.cookie("name", "value");    res.cookie({        name: "name",        value: "value",    });    res.cookie("name");    res.json({        path: req.path,        query: req.query,        params: req.params,        cookies: req.cookies,        body: req.body,        message: "routerA patch",    });});const router2 = new Router();router2.use((req, res, next) => {    next();});router2.use("/routerA", routerA);router2.get("/", (req, res, next) => {    res.json({ message: "router2 get" });});const router1 = new Router();router1.use((req, res, next) => {    next();});router1.get("/", (req, res, next) => {    res.json({ message: "router1 get" });});const app = new Router();app.use((req, res, next) => {    next();});app.use("/router1", router1);app.use("/router2", router2);app.get("/", (req, res, next) => {    res.json({ message: "app get" });});app.get("/error", (req, res, next) => {    throw new Error("message");});app.use((req, res, next) => {    next({ message: "custom not found" });});app.use((err, req, res, next) => {    // custom error    res.json({ err });});app.listen(3000);```


* [router](#module_router)
    * [~Router](#module_router..Router)
        * [.use(path, callback)](#module_router..Router+use)
        * [.request(req)](#module_router..Router+request) ⇒ <code>Object/Stream</code>
        * [.response(req, res)](#module_router..Router+response) ⇒ <code>Object/Stream</code>
        * [.listen(port, hostname, backlog)](#module_router..Router+listen) ⇒ <code>Server</code>
    * [~post(path, callback)](#module_router..post)
    * [~get(path, callback)](#module_router..get)
    * [~patch(path, callback)](#module_router..patch)
    * [~put(path, callback)](#module_router..put)
    * [~delete(path, callback)](#module_router..delete)

<a name="module_router..Router"></a>

### router~Router
**Kind**: inner class of [<code>router</code>](#module_router)  

* [~Router](#module_router..Router)
    * [.use(path, callback)](#module_router..Router+use)
    * [.request(req)](#module_router..Router+request) ⇒ <code>Object/Stream</code>
    * [.response(req, res)](#module_router..Router+response) ⇒ <code>Object/Stream</code>
    * [.listen(port, hostname, backlog)](#module_router..Router+listen) ⇒ <code>Server</code>

<a name="module_router..Router+use"></a>

#### router.use(path, callback)
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| path | <code>String/Function</code> | 
| callback | <code>function</code> | 

<a name="module_router..Router+request"></a>

#### router.request(req) ⇒ <code>Object/Stream</code>
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| req | <code>Object/Stream</code> | 
| req.headers | <code>Object</code> | 
| req.path | <code>Object</code> | 
| req.query | <code>Object</code> | 
| req.params | <code>Object</code> | 
| req.cookies | <code>Object</code> | 
| req.body | <code>Any</code> | 

<a name="module_router..Router+response"></a>

#### router.response(req, res) ⇒ <code>Object/Stream</code>
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| req | <code>Object/Stream</code> | 
| res | <code>Object/Stream</code> | 
| res.status | <code>Number</code> | 
| res.headers | <code>Object</code> | 
| res.send | <code>function</code> | 
| res.json | <code>function</code> | 
| res.cookie | <code>function</code> | 
| res.redirect | <code>function</code> | 

<a name="module_router..Router+listen"></a>

#### router.listen(port, hostname, backlog) ⇒ <code>Server</code>
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| port | <code>Number</code> | 
| hostname | <code>String/Function</code> | 
| backlog | <code>function</code> | 

<a name="module_router..post"></a>

### router~post(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/RegExp</code> | 
| callback | <code>function</code> | 

<a name="module_router..get"></a>

### router~get(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/RegExp</code> | 
| callback | <code>function</code> | 

<a name="module_router..patch"></a>

### router~patch(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/RegExp</code> | 
| callback | <code>function</code> | 

<a name="module_router..put"></a>

### router~put(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/RegExp</code> | 
| callback | <code>function</code> | 

<a name="module_router..delete"></a>

### router~delete(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/RegExp</code> | 
| callback | <code>function</code> | 

