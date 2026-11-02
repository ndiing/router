const { ServerResponse } = require("node:http");

class Response extends ServerResponse {
    done = false;

    end(...args) {
        this.done = true;
        return super.end(...args);
    }

    status(code) {
        this.statusCode = code;
        return this;
    }

    send(chunk) {
        return this.end(chunk);
    }

    json(value) {
        this.setHeader("Content-Type", "application/json");
        return this.end(JSON.stringify(value));
    }
}

exports.Response = Response;
