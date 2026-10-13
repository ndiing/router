const http = require("node:http");

class Response extends http.ServerResponse {
    send(chunk) {
        this.end(chunk);
    }
    
    json(value) {
        this.setHeader("Content-Type","application/json")
        this.end(JSON.stringify(value));
    }
}
exports.Response = Response;
