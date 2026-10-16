const App = require("../src");

const app = new App()
app.get('/',(req,res)=>res.json({hello:'word'}))
app.listen(3000)