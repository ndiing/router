const http = require("node:http");

class Response extends http.ServerResponse {
    send(string) {
        this.end(string);
        this.done = true;
    }

    json(object) {
        this.setHeader("content-type", "application/json");
        this.send(JSON.stringify(object));
    }
}
exports.Response = Response;
