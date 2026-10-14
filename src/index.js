require('./polyfill.js')
const { json } = require("./middleware/json.js");
const { cors } = require("./middleware/cors.js");
const { App } = require("./app.js");
const { Router } = require("./router.js");

App.Router = Router;
App.json = json;
App.cors = cors;

module.exports = App;
