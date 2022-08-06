<a name="module_Router"></a>

## Router ⇒ <code>Object</code>
Nodejs router### Install```npm install @ndiing/router```### Usage```jsnpm install @ndiing/router```


* [Router](#module_Router) ⇒ <code>Object</code>
    * [.app(req, res)](#module_Router.app)
        * [.listen(port, hostname, backlog)](#module_Router.app.listen) ⇒ <code>Object</code>
    * [.app.use(path, args)](#module_Router.app.use)
    * [.{post/get/patch/put/delete}(path, args)](#module_Router.{post/get/patch/put/delete})

<a name="module_Router.app"></a>

### Router.app(req, res)
requestListener

**Kind**: static method of [<code>Router</code>](#module_Router)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | IncomingMessage |
| req.Url | <code>Object</code> | - |
| req.query | <code>Object</code> | - |
| req.mimeType | <code>String</code> | - |
| req.cookie | <code>Object</code> | - |
| req.body | <code>Object/String</code> | - |
| res | <code>Object</code> | ServerResponse |
| res.cookie | <code>function</code> | (name,value,options={}) |
| res.json | <code>function</code> | (value) |

<a name="module_Router.app.listen"></a>

#### app.listen(port, hostname, backlog) ⇒ <code>Object</code>
Create server

**Kind**: static method of [<code>app</code>](#module_Router.app)  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>Number</code> | - |
| hostname | <code>String</code> | Optional |
| backlog | <code>function</code> | - |

<a name="module_Router.app.use"></a>

### Router.app.use(path, args)
Add middleware

**Kind**: static method of [<code>Router</code>](#module_Router)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | Optional |
| args | <code>function</code> | Set one or more handler |

<a name="module_Router.{post/get/patch/put/delete}"></a>

### Router.{post/get/patch/put/delete}(path, args)
Add middleware

**Kind**: static method of [<code>Router</code>](#module_Router)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | - |
| args | <code>function</code> | Set one or more handler |

