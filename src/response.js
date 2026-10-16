const http = require("node:http");

class Response extends http.ServerResponse {
    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    }
    send(chunk) {
        if (this.writableEnded) return;
        this.end(chunk,null,null);//avoid ArgumentsAdaptorTrampoline from V8
    }
    json(value) {
        if (this.writableEnded) return;
        if (this.headersSent) {
            this.end();
            return;
        }
        this.setHeader("Content-Type", "application/json");
        this.end(JSON.stringify(value),null,null);//avoid ArgumentsAdaptorTrampoline from V8
    }
}
exports.Response = Response;
