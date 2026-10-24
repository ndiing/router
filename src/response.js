const http = require("http");

class Response extends http.ServerResponse {
    /**
     * @param {Number} code
     * @returns {Response}
     */
    status(code) {
        this.statusCode = code;
        return this;
    }

    /**
     * @param {String} chunk
     */
    send(chunk) {
        if (this.writableEnded) return;
        this.end(chunk, null, null);
    }

    /**
     * @param {Object} value
     */
    json(value) {
        if (!this.headersSent) {
            this.setHeader("Content-Type", "application/json; charset=utf-8");
        }
        this.send(JSON.stringify(value));
    }
}
exports.Response = Response;
