const http = require("http");
const fs = require("fs");
const path = require("path");

class Response extends http.ServerResponse {
    /**
     * @param {number} statusCode
     * @returns {this}
     */
    status(statusCode = 200) {
        this.statusCode = statusCode;
        return this;
    }

    /**
     * @param {string} data
     */
    send(data) {
        this.setHeader("Content-Type", "text/html");
        this.setHeader("Content-Length", Buffer.byteLength(data));
        this.end(data);
    }

    /**
     * @param {object} data
     */
    json(data) {
        const body = JSON.stringify(data);
        this.setHeader("Content-Type", "application/json");
        this.setHeader("Content-Length", Buffer.byteLength(body));
        this.end(body);
    }

    /**
     * @param {string} filePath
     * @param {string} filename
     */
    download(filePath, filename) {
        const stat = fs.statSync(filePath);
        const basename = filename || path.basename(filePath);

        this.setHeader("Content-Type", "application/octet-stream");
        this.setHeader("Content-Length", stat.size);
        this.setHeader("Content-Disposition", `attachment; filename="${basename}"`);

        const stream = fs.createReadStream(filePath);
        stream.on("error", (err) => {
            if (!this.headersSent) {
                this.status(500);
            }
            this.end();
        });

        stream.pipe(this);
    }
}
exports.Response = Response;
