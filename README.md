<a name="module_router"></a>

## router
### Install```npm install @ndiing/router```


* [router](#module_router)
    * [~Router](#module_router..Router)
        * [.use(path, callback)](#module_router..Router+use)
        * [.request(req)](#module_router..Router+request) ⇒ <code>Stream</code>
        * [.response(res)](#module_router..Router+response) ⇒ <code>Stream</code>
        * [.listen(port, hostname, backlog)](#module_router..Router+listen) ⇒ <code>Object</code>
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
    * [.request(req)](#module_router..Router+request) ⇒ <code>Stream</code>
    * [.response(res)](#module_router..Router+response) ⇒ <code>Stream</code>
    * [.listen(port, hostname, backlog)](#module_router..Router+listen) ⇒ <code>Object</code>

<a name="module_router..Router+use"></a>

#### router.use(path, callback)
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| path | <code>String/Function</code> | 
| callback | <code>function</code> | 

<a name="module_router..Router+request"></a>

#### router.request(req) ⇒ <code>Stream</code>
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| req | <code>Stream</code> | 

**Properties**

| Name | Type |
| --- | --- |
| req.url2 | <code>Object</code> | 
| req.path | <code>String</code> | 
| req.params | <code>Object</code> | 
| req.query | <code>Object</code> | 
| req.headers | <code>Object</code> | 
| req.cookies | <code>Object</code> | 
| req.contentType | <code>String</code> | 
| req.body | <code>Any</code> | 

<a name="module_router..Router+response"></a>

#### router.response(res) ⇒ <code>Stream</code>
**Kind**: instance method of [<code>Router</code>](#module_router..Router)  

| Param | Type |
| --- | --- |
| res | <code>Stream</code> | 

**Properties**

| Name | Type |
| --- | --- |
| res.status | <code>Number</code> | 
| res.headers | <code>Object</code> | 
| res.send | <code>function</code> | 
| res.json | <code>function</code> | 
| res.redirect | <code>function</code> | 

<a name="module_router..Router+listen"></a>

#### router.listen(port, hostname, backlog) ⇒ <code>Object</code>
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
| path | <code>String/Function</code> | 
| callback | <code>function</code> | 

<a name="module_router..get"></a>

### router~get(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/Function</code> | 
| callback | <code>function</code> | 

<a name="module_router..patch"></a>

### router~patch(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/Function</code> | 
| callback | <code>function</code> | 

<a name="module_router..put"></a>

### router~put(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/Function</code> | 
| callback | <code>function</code> | 

<a name="module_router..delete"></a>

### router~delete(path, callback)
**Kind**: inner method of [<code>router</code>](#module_router)  

| Param | Type |
| --- | --- |
| path | <code>String/Function</code> | 
| callback | <code>function</code> | 

