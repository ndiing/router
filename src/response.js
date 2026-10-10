const { ServerResponse } = require("node:http");

class Response extends ServerResponse {
    send(string) {
        this.done = true;
        this.end(string);
    }

    json(object) {
        this.setHeader("content-type", "application/json");
        this.send(JSON.stringify(object));
    }
}
exports.Response = Response;
