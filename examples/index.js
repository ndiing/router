const Router = require('../index.js')

// Create router 1
var router1 = Router();
router1.use((req, res, next) => {
    next();
});
// Using HTTP method POST
router1.post("/", (req, res, next) => {
    res.json({ message: "from router1 post" });
});
// Using HTTP method GET
router1.get("/", (req, res, next) => {
    res.json({ message: "from router1 get" });
});
// Using HTTP method PATCH
router1.patch("/:id", (req, res, next) => {

    console.log(req.Url)// Get URL info
    console.log(req.params)// Get parameters from path
    console.log(req.query)// Get query object
    console.log(req.mimeType)// Get content-type
    console.log(req.cookie)// Get cookie object
    console.log(req.body)// Get request message/data

    // Send cookie
    res.cookie('name1','value1')
    // another
    res.cookie('name2','value2')
    // another
    res.cookie('name3','value3')
    // and remove one
    // from previous cookie
    res.cookie('name')

    // Send json output
    res.json({ message: "from router1 patch" });
});
// Using HTTP method DELETE
router1.delete("/:id", (req, res, next) => {
    res.json({ message: "from router1 delete" });
});
// console.log(router1.routes);

// Create another example router A
const routerA = Router();
routerA.use((req, res, next) => {
    next();
});
routerA.get("/", (req, res, next) => {
    res.json({ message: "from routerA get" });
});

// Create another example router B
const routerB = Router();
routerB.use((req, res, next) => {
    next();
});
routerB.get("/", (req, res, next) => {
    res.json({ message: "from routerB get" });
});

const router2 = Router();
router2.use((req, res, next) => {
    next();
});
// Register router A
// Register router B
router2.get("/routerA", routerA);
router2.get("/routerB", routerB);
router2.get("/", (req, res, next) => {
    res.json({ message: "from router2 get" });
});

// Create app
const app = Router();
app.use((req, res, next) => {
    next();
});
// Register router 1
// Register router 2
app.get("/router1", router1);
app.get("/router2", router2);
app.use((req, res, next) => {
    console.log('app+middleware')
    next()
});
app.use('/book',(req, res, next) => {
    console.log('prefix+middleware')
    next()
});
app.get("/", (req, res, next) => {
    console.log('method+middleware')
    next()
});
app.get("/", (req, res, next) => {
    res.json({ message: "from app get" });
});

// Custom not found handler
app.use((req, res, next) => {
    next({message:'page not found'});
});

// Custom global error handler
app.use((err, req, res, next) => {
    res.json({ err });
});

// Create server and listen on port 80
app.listen(80);
