<a name="module_router"></a>

## router
Nodejs router module### Install```npm install @ndiing/router```


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

