const router = require('../index.js')

// create router
const router1 = router()
router1.use((req,res,next) => {
    console.log('hi im middleware from router1')
    next()
})
router1.get('/',(req,res,next) => {
    res.json({message:'hello message from router1'})
})

// create app
const app = router()

// register router1
// in app
app.use('/router1',router1)

app.get('/',(req,res,next) => {
    res.json({welcome:'welcome app'})
})

// using patch method
// or another method are the same
app.patch('/:id',(req,res,next) => {
    
    // get Url > new URL()
    console.log(req.Url)
    
    // get params
    console.log(req.params)
    
    // get query
    console.log(req.query)
    
    // get mimeType
    console.log(req.mimeType)
    
    // get body
    console.log(req.body)
    
    // get cookie
    console.log(req.cookie)

    // send cookie
    res.cookie('name1','value1')

    // send json
    res.json({welcome:'patch data from app'})
})

// create server
app.listen(5555, () => {
    console.log('server listen on port 5555')
})

// open
// http://127.0.0.1:5555/
// http://127.0.0.1:5555/router1
