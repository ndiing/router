const { inspect } = require("node:util");
const { json } = require("./json.js");
const { App } = require("./app.js");
const { Router } = require("./router.js");

App.Router=Router
App.json=json

module.exports=App
