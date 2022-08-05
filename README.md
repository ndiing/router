<a name="module_router"></a>

## router
Nodejs router module### Install```npm install @ndiing/router```### Usage```const router = require('../index.js')// create routerconst router1 = router()router1.use((req,res,next) => {    console.log('hi im middleware from router1')    next()})router1.get('/',(req,res,next) => {    res.json({message:'hello message from router1'})})// create appconst app = router()// register router1// in appapp.use('/router1',router1)app.get('/',(req,res,next) => {    res.json({welcome:'welcome app'})})// using patch method// or another method are the sameapp.patch('/:id',(req,res,next) => {    // get Url > new URL()    console.log(req.Url)    // get params    console.log(req.params)    // get query    console.log(req.query)    // get mimeType    console.log(req.mimeType)    // get body    console.log(req.body)    // get cookie    console.log(req.cookie)    // send cookie    res.cookie('name1','value1')    // send json    res.json({welcome:'patch data from app'})})// create serverapp.listen(5555, () => {    console.log('server listen on port 5555')})// open// http://127.0.0.1:5555/// http://127.0.0.1:5555/router1```


* [router](#module_router)
    * [.app(req, res)](#module_router.app)
    * [.app.use(path, middleware)](#module_router.app.use)
    * [.{get/post/put/patch/delete}(path, middleware)](#module_router.{get/post/put/patch/delete})
    * [.app.listen(port, hostname, backlog)](#module_router.app.listen)

<a name="module_router.app"></a>

### router.app(req, res)
**Kind**: static method of [<code>router</code>](#module_router)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | - |
| req.Url | <code>Object</code> | - |
| req.query | <code>Object</code> | - |
| req.cookie | <code>Object</code> | - |
| req.mimeType | <code>Object</code> | - |
| req.body | <code>Object</code> | - |
| res | <code>Object</code> | - |
| res.cookie | <code>function</code> | (name,value,options) |
| res.json | <code>function</code> | (object) |

<a name="module_router.app.use"></a>

### router.app.use(path, middleware)
Add middleware

**Kind**: static method of [<code>router</code>](#module_router)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | - |
| middleware | <code>function</code> | - |

<a name="module_router.{get/post/put/patch/delete}"></a>

### router.{get/post/put/patch/delete}(path, middleware)
Add middleware

**Kind**: static method of [<code>router</code>](#module_router)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | - |
| middleware | <code>function</code> | - |

<a name="module_router.app.listen"></a>

### router.app.listen(port, hostname, backlog)
**Kind**: static method of [<code>router</code>](#module_router)  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>Number</code> | - |
| hostname | <code>String</code> | - |
| backlog | <code>function</code> | - |

