<a name="module_router"></a>

## router
### Install```npm install @ndiing/router```

**See**: [./test.js](./test.js)  

* [router](#module_router)
    * [~Request](#module_router..Request)
        * [new Request(input, options)](#new_module_router..Request_new)
        * [.json()](#module_router..Request+json) ⇒ <code>Object</code>
        * [.text()](#module_router..Request+text) ⇒ <code>String</code>
    * [~Response](#module_router..Response)
        * [new Response(body, options)](#new_module_router..Response_new)
        * [.cookie(name, value)](#module_router..Response+cookie)
        * [.buffer(data)](#module_router..Response+buffer)
        * [.json(value)](#module_router..Response+json)
        * [.text(value)](#module_router..Response+text)
        * [.redirect(url, status)](#module_router..Response+redirect)
    * [~Router](#module_router..Router)
        * [new Router(routes)](#new_module_router..Router_new)
        * [.add(method, path, ...callback)](#module_router..Router+add)
        * [.requestListener(req, res)](#module_router..Router+requestListener)
        * [.listen(port, hostname, backlog)](#module_router..Router+listen) ⇒ <code>Object</code>
    * [~router()](#module_router..router) ⇒ <code>Object/Function</code>
    * [~use(...args)](#module_router..use)
    * [~post(...args)](#module_router..post)
    * [~get(...args)](#module_router..get)
    * [~patch(...args)](#module_router..patch)
    * [~put(...args)](#module_router..put)
    * [~delete(...args)](#module_router..delete)
    * [~listen(...args)](#module_router..listen) ⇒ <code>Object</code>

<a name="module_router..Request"></a>

### router~Request
**Kind**: inner class of [<code>router</code>](#module_router)  

* [~Request](#module_router..Request)
    * [new Request(input, options)](#new_module_router..Request_new)
    * [.json()](#module_router..Request+json) ⇒ <code>Object</code>
    * [.text()](#module_router..Request+text) ⇒ <code>String</code>

<a name="new_module_router..Request_new"></a>

#### new Request(input, options)

| Param | Type |
| --- | --- |
| input | <code>String</code> | 
| options | <code>Object</code> | 
| options.body | <code>Stream</code> | 
| options.headers | <code>Object</code> | 
| options.method | <code>String</code> | 
| options.url | <code>Object</code> | 
| options.params | <code>Object</code> | 
| options.cookies | <code>Object</code> | 

<a name="module_router..Request+json"></a>

#### request.json() ⇒ <code>Object</code>
**Kind**: instance method of [<code>Request</code>](#module_router..Request)  
<a name="module_router..Request+text"></a>

#### request.text() ⇒ <code>String</code>
**Kind**: instance method of [<code>Request</code>](#module_router..Request)  
<a name="module_router..Response"></a>

### router~Response
**Kind**: inner class of [<code>router</code>](#module_router)  

* [~Response](#module_router..Response)
    * [new Response(body, options)](#new_module_router..Response_new)
    * [.cookie(name, value)](#module_router..Response+cookie)
    * [.buffer(data)](#module_router..Response+buffer)
    * [.json(value)](#module_router..Response+json)
    * [.text(value)](#module_router..Response+text)
    * [.redirect(url, status)](#module_router..Response+redirect)

<a name="new_module_router..Response_new"></a>

#### new Response(body, options)

| Param | Type |
| --- | --- |
| body | <code>Stream</code> | 
| options | <code>Object</code> | 
| options.headers | <code>Object</code> | 
| options.status | <code>Number</code> | 

<a name="module_router..Response+cookie"></a>

#### response.cookie(name, value)
**Kind**: instance method of [<code>Response</code>](#module_router..Response)  

| Param | Type |
| --- | --- |
| name | <code>String/Object</code> | 
| value | <code>String</code> | 

<a name="module_router..Response+buffer"></a>

#### response.buffer(data)
**Kind**: instance method of [<code>Response</code>](#module_router..Response)  

| Param | Type |
| --- | --- |
| data | <code>Any</code> | 

<a name="module_router..Response+json"></a>

#### response.json(value)
**Kind**: instance method of [<code>Response</code>](#module_router..Response)  

| Param | Type |
| --- | --- |
| value | <code>Object</code> | 

<a name="module_router..Response+text"></a>

#### response.text(value)
**Kind**: instance method of [<code>Response</code>](#module_router..Response)  

| Param | Type |
| --- | --- |
| value | <code>String</code> | 

<a name="module_router..Response+redirect"></a>

#### response.redirect(url, status)
**Kind**: instance method of [<code>Response</code>](#module_router..Response)  

| Param | Type | Default |
| --- | --- | --- |
| url | <code>String</code> |  | 
| status | <code>Number</code> | <code>302</code> | 

<a name="module_router..Router"></a>

### router~Router
**Kind**: inner class of [<code>router</code>](#module_router)  

* [~Router](#module_router..Router)
    * [new Router(routes)](#new_module_router..Router_new)
    * [.add(method, path, ...callback)](#module_router..Router+add)
    * [.requestListener(req, res)](#module_router..Router+requestListener)
    * [.listen(port, hostname, backlog)](#module_router..Router+listen) ⇒ <code>Object</code>

<a name="new_module_router..Router_new"></a>

#### new Router(routes)

| Param | Type |
| --- | --- |
| routes | <code>Array</code> | 

<a name="module_router..Router+add"></a>

#### router.add(method, path, ...callback)
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| method | <code>String</code> | 
| path | <code>String</code> | 
| ...callback | <code>any</code> | 

<a name="module_router..Router+requestListener"></a>

#### router.requestListener(req, res)
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| req | <code>Stream</code> | 
| res | <code>Stream</code> | 

<a name="module_router..Router+listen"></a>

#### router.listen(port, hostname, backlog) ⇒ <code>Object</code>
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| port | <code>Number</code> | 
| hostname | <code>String/Function</code> | 
| backlog | <code>function</code> | 

<a name="module_router..router"></a>

### router~router() ⇒ <code>Object/Function</code>
**Kind**: inner method of [<code>router</code>](#module_router)  
<a name="module_router..use"></a>

### router~use(...args)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| ...args | <code>any</code> | 

<a name="module_router..post"></a>

### router~post(...args)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| ...args | <code>any</code> | 

<a name="module_router..get"></a>

### router~get(...args)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| ...args | <code>any</code> | 

<a name="module_router..patch"></a>

### router~patch(...args)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| ...args | <code>any</code> | 

<a name="module_router..put"></a>

### router~put(...args)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| ...args | <code>any</code> | 

<a name="module_router..delete"></a>

### router~delete(...args)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| ...args | <code>any</code> | 

<a name="module_router..listen"></a>

### router~listen(...args) ⇒ <code>Object</code>
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| ...args | <code>any</code> | 

