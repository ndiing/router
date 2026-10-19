require("./polyfill");
const { App } = require("./app");
const { Router } = require("./router");
const { json } = require("./middleware/json");
const { cors } = require("./middleware/cors");

App.Router = Router;
App.json = json;
App.cors = cors;

module.exports = App;
