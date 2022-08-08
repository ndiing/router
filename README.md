<a name="module_router"></a>

## router
Nodejs router module### Install```npm install @ndiing/router```

**See**

- [./examples/server.js](./examples/server.js)
- [./examples/server-express-like-style.js](./examples/server-express-like-style.js)


* [router](#module_router)
    * [~Headers](#module_router..Headers)
        * [new Headers(init)](#new_module_router..Headers_new)
        * [.append(name, value)](#module_router..Headers+append)
        * [.delete(name)](#module_router..Headers+delete)
        * [.entries()](#module_router..Headers+entries) ⇒ <code>Array</code>
        * [.get(name)](#module_router..Headers+get) ⇒ <code>Any</code>
        * [.has(name)](#module_router..Headers+has) ⇒ <code>Boolean</code>
        * [.keys()](#module_router..Headers+keys) ⇒ <code>Array</code>
        * [.set(name, value)](#module_router..Headers+set)
        * [.values()](#module_router..Headers+values) ⇒ <code>Array</code>
    * [~Request](#module_router..Request)
        * [new Request(input, options)](#new_module_router..Request_new)
        * [.body](#module_router..Request+body)
        * [.headers](#module_router..Request+headers)
        * [.method](#module_router..Request+method)
        * [.url](#module_router..Request+url)
            * [.searchParams](#module_router..Request+url.searchParams)
        * [.stream](#module_router..Request+stream)
        * [.params](#module_router..Request+params)
        * [.query](#module_router..Request+query)
        * [.cookies](#module_router..Request+cookies)
    * [~Response](#module_router..Response)
        * [new Response(body, options)](#new_module_router..Response_new)
        * [.headers](#module_router..Response+headers)
        * [.status](#module_router..Response+status)
        * [.send(value)](#module_router..Response+send)
        * [.json(value)](#module_router..Response+json)
        * [.cookie(name, value)](#module_router..Response+cookie)
    * [~Router](#module_router..Router)
        * [new Router(init)](#new_module_router..Router_new)
        * [.routes](#module_router..Router+routes)
        * [.requestListener(req, res)](#module_router..Router+requestListener)
    * [~Layer()](#module_router..Layer)
    * [~use(path, callback)](#module_router..use)
    * [~post/get/patch/put/delete(path, callback)](#module_router..post/get/patch/put/delete)
    * [~listen(port, hostname, backlog)](#module_router..listen) ⇒ <code>Object</code>

<a name="module_router..Headers"></a>

### router~Headers
**Kind**: inner class of [<code>router</code>](#module_router)  

* [~Headers](#module_router..Headers)
    * [new Headers(init)](#new_module_router..Headers_new)
    * [.append(name, value)](#module_router..Headers+append)
    * [.delete(name)](#module_router..Headers+delete)
    * [.entries()](#module_router..Headers+entries) ⇒ <code>Array</code>
    * [.get(name)](#module_router..Headers+get) ⇒ <code>Any</code>
    * [.has(name)](#module_router..Headers+has) ⇒ <code>Boolean</code>
    * [.keys()](#module_router..Headers+keys) ⇒ <code>Array</code>
    * [.set(name, value)](#module_router..Headers+set)
    * [.values()](#module_router..Headers+values) ⇒ <code>Array</code>

<a name="new_module_router..Headers_new"></a>

#### new Headers(init)
Create headers


| Param | Type |
| --- | --- |
| init | <code>Any</code> | 

<a name="module_router..Headers+append"></a>

#### headers.append(name, value)
Append value by name, if exists it's create an array of values

**Kind**: instance method of [<code>Headers</code>](#module_router..Headers)  

| Param | Type |
| --- | --- |
| name | <code>Any</code> | 
| value | <code>Any</code> | 

<a name="module_router..Headers+delete"></a>

#### headers.delete(name)
Delete headers by name

**Kind**: instance method of [<code>Headers</code>](#module_router..Headers)  

| Param | Type |
| --- | --- |
| name | <code>Any</code> | 

<a name="module_router..Headers+entries"></a>

#### headers.entries() ⇒ <code>Array</code>
Get array of [name,value]

**Kind**: instance method of [<code>Headers</code>](#module_router..Headers)  
<a name="module_router..Headers+get"></a>

#### headers.get(name) ⇒ <code>Any</code>
Get headers by name

**Kind**: instance method of [<code>Headers</code>](#module_router..Headers)  

| Param | Type |
| --- | --- |
| name | <code>Any</code> | 

<a name="module_router..Headers+has"></a>

#### headers.has(name) ⇒ <code>Boolean</code>
Check headers name exists

**Kind**: instance method of [<code>Headers</code>](#module_router..Headers)  

| Param | Type |
| --- | --- |
| name | <code>Any</code> | 

<a name="module_router..Headers+keys"></a>

#### headers.keys() ⇒ <code>Array</code>
Get array of headers names

**Kind**: instance method of [<code>Headers</code>](#module_router..Headers)  
<a name="module_router..Headers+set"></a>

#### headers.set(name, value)
Set value by name

**Kind**: instance method of [<code>Headers</code>](#module_router..Headers)  

| Param | Type |
| --- | --- |
| name | <code>Any</code> | 
| value | <code>Any</code> | 

<a name="module_router..Headers+values"></a>

#### headers.values() ⇒ <code>Array</code>
Get Array of heades value

**Kind**: instance method of [<code>Headers</code>](#module_router..Headers)  
<a name="module_router..Request"></a>

### router~Request
**Kind**: inner class of [<code>router</code>](#module_router)  

* [~Request](#module_router..Request)
    * [new Request(input, options)](#new_module_router..Request_new)
    * [.body](#module_router..Request+body)
    * [.headers](#module_router..Request+headers)
    * [.method](#module_router..Request+method)
    * [.url](#module_router..Request+url)
        * [.searchParams](#module_router..Request+url.searchParams)
    * [.stream](#module_router..Request+stream)
    * [.params](#module_router..Request+params)
    * [.query](#module_router..Request+query)
    * [.cookies](#module_router..Request+cookies)

<a name="new_module_router..Request_new"></a>

#### new Request(input, options)
Wrap Request from stream


| Param | Type |
| --- | --- |
| input | <code>Any</code> | 
| options | <code>Any</code> | 

<a name="module_router..Request+body"></a>

#### request.body
**Kind**: instance property of [<code>Request</code>](#module_router..Request)  
**Read only**: true  
<a name="module_router..Request+headers"></a>

#### request.headers
**Kind**: instance property of [<code>Request</code>](#module_router..Request)  
**Read only**: true  
<a name="module_router..Request+method"></a>

#### request.method
**Kind**: instance property of [<code>Request</code>](#module_router..Request)  
**Read only**: true  
<a name="module_router..Request+url"></a>

#### request.url
**Kind**: instance property of [<code>Request</code>](#module_router..Request)  
**Read only**: true  
<a name="module_router..Request+url.searchParams"></a>

##### url.searchParams
**Kind**: static property of [<code>url</code>](#module_router..Request+url)  
**Read only**: true  
<a name="module_router..Request+stream"></a>

#### request.stream
**Kind**: instance property of [<code>Request</code>](#module_router..Request)  
**Read only**: true  
<a name="module_router..Request+params"></a>

#### request.params
**Kind**: instance property of [<code>Request</code>](#module_router..Request)  
**Read only**: true  
<a name="module_router..Request+query"></a>

#### request.query
**Kind**: instance property of [<code>Request</code>](#module_router..Request)  
**Read only**: true  
<a name="module_router..Request+cookies"></a>

#### request.cookies
**Kind**: instance property of [<code>Request</code>](#module_router..Request)  
**Read only**: true  
<a name="module_router..Response"></a>

### router~Response
**Kind**: inner class of [<code>router</code>](#module_router)  

* [~Response](#module_router..Response)
    * [new Response(body, options)](#new_module_router..Response_new)
    * [.headers](#module_router..Response+headers)
    * [.status](#module_router..Response+status)
    * [.send(value)](#module_router..Response+send)
    * [.json(value)](#module_router..Response+json)
    * [.cookie(name, value)](#module_router..Response+cookie)

<a name="new_module_router..Response_new"></a>

#### new Response(body, options)

| Param | Type |
| --- | --- |
| body | <code>Any</code> | 
| options | <code>Any</code> | 

<a name="module_router..Response+headers"></a>

#### response.headers
**Kind**: instance property of [<code>Response</code>](#module_router..Response)  
**Read only**: true  
<a name="module_router..Response+status"></a>

#### response.status
**Kind**: instance property of [<code>Response</code>](#module_router..Response)  
**Read only**: true  
<a name="module_router..Response+send"></a>

#### response.send(value)
Send string of response

**Kind**: instance method of [<code>Response</code>](#module_router..Response)  

| Param | Type |
| --- | --- |
| value | <code>Any</code> | 

<a name="module_router..Response+json"></a>

#### response.json(value)
Send object/array as json response

**Kind**: instance method of [<code>Response</code>](#module_router..Response)  

| Param | Type |
| --- | --- |
| value | <code>Any</code> | 

<a name="module_router..Response+cookie"></a>

#### response.cookie(name, value)
Send `set-cookie`

**Kind**: instance method of [<code>Response</code>](#module_router..Response)  

| Param | Type |
| --- | --- |
| name | <code>Any</code> | 
| value | <code>Any</code> | 

<a name="module_router..Router"></a>

### router~Router
**Kind**: inner class of [<code>router</code>](#module_router)  

* [~Router](#module_router..Router)
    * [new Router(init)](#new_module_router..Router_new)
    * [.routes](#module_router..Router+routes)
    * [.requestListener(req, res)](#module_router..Router+requestListener)

<a name="new_module_router..Router_new"></a>

#### new Router(init)
Create router


| Param | Type |
| --- | --- |
| init | <code>Any</code> | 

<a name="module_router..Router+routes"></a>

#### router.routes
**Kind**: instance property of [<code>Router</code>](#module_router..Router)  
**Read only**: true  
<a name="module_router..Router+requestListener"></a>

#### router.requestListener(req, res)
`http.requestListener`

**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| req | <code>Any</code> | 
| res | <code>Any</code> | 

<a name="module_router..Layer"></a>

### router~Layer()
**Kind**: inner method of [<code>router</code>](#module_router)  
<a name="module_router..use"></a>

### router~use(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | - |
| callback | <code>Array/Function</code> | - |

<a name="module_router..post/get/patch/put/delete"></a>

### router~post/get/patch/put/delete(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>String</code> | - |
| callback | <code>Array/Function</code> | - |

<a name="module_router..listen"></a>

### router~listen(port, hostname, backlog) ⇒ <code>Object</code>
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>Number</code> | - |
| hostname | <code>String</code> | - |
| backlog | <code>function</code> | - |

