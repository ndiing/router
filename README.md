
# Router
nodejs backend router

### Install
```
npm install @ndiing/router
```

### Usage

```js
const Router = require('@ndiing/router')
const router1 = Router()

// Adding middleware in router1
router1.use((req,res,next) => {
    // When finish call next()
    next()
})
router1.get('/',(req,res,next) => {
    res.json({message:'This from router1'})
})

const app = Router()
app.use((req,res,next) => {
    // Set header
    // for security reason
    // and cors
    const headers = {}
    for(const name in headers){
        res.setHeader(name,headers[name])
    }

    // when finish call next()
    next()
})
app.get('/',(req,res,next) => {
    res.json({message:'get app'})
})
app.post('/',(req,res,next) => {
    res.json({message:'post app'})
})
app.patch('/:id',(req,res,next) => {
    // Get params data
    console.log(req.params)

    // Get query data
    console.log(req.query)

    // Get cookie data
    console.log(req.cookie)

    // Get body data
    console.log(req.body)

    // Send cookie data
    res.cookie('name','value')

    // Send multiple cookie data
    res.cookie('name','value')
    res.cookie('name2','value2')

    // Remove cookie by name
    res.cookie('name')

    // Remove all cookie
    res.cookie()

    res.json({message:'patch app'})
})
app.delete('/:id',(req,res,next) => {
    res.json({message:'delete app'})
})

// Running server
app.listen(5555, () => {
    console.log('App listen on port 5555')
    // then open
    // http://localhost:5555
})
```