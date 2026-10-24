require("./polyfill");
const { App } = require("./app");
const { Router } = require("./router");
const { json } = require("./middleware/json");
const { cors } = require("./middleware/cors");
const { urlencoded } = require("./middleware/urlencoded");

App.Router = Router;
App.json = json;
App.cors = cors;
App.urlencoded = urlencoded;

module.exports = App;
