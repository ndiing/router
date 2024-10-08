const Router = require("./lib/router.js");
const { compression, messages, cookies, security, cors, authorization, fallback, catchAll } = require("./lib/middleware.js");
Router.compression = compression;
Router.messages = messages;
Router.cookies = cookies;
Router.security = security;
Router.cors = cors;
Router.authorization = authorization;
Router.fallback = fallback;
Router.catchAll = catchAll;
module.exports = Router;
