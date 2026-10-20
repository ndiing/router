const http = require("http");

class Response extends http.ServerResponse {
    status(code) {
        this.statusCode = code;
        return this;
    }

    send(chunk) {
        if (this.writableEnded) return;
        this.end(chunk, null, null);
    }
    
    json(value) {
        if (!this.headersSent) {
            this.setHeader("Content-Type", "application/json; charset=utf-8");
        }
        this.send(JSON.stringify(value));
    }
}
exports.Response = Response;
