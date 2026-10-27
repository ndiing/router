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
        this.writeHead(this.statusCode, {
            "Content-Type": "text/html",
            "Content-Length": Buffer.byteLength(data),
        });
        this.end(data);
    }

    /**
     * @param {object} data
     */
    json(data) {
        const body = JSON.stringify(data);
        this.writeHead(this.statusCode, {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
        });
        this.end(body);
    }

    /**
     * @param {string} filePath
     * @param {string} filename
     */
    download(filePath, filename) {
        if (!fs.existsSync(filePath)) {
            this.writeHead(404, { "Content-Type": "text/plain" });
            return this.end();
        }

        const stat = fs.statSync(filePath);
        const basename = filename || path.basename(filePath);

        this.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Length": stat.size,
            "Content-Disposition": `attachment; filename="${basename}"`,
        });

        const stream = fs.createReadStream(filePath);
        stream.on("error", (err) => {
            if (!this.headersSent) {
                this.writeHead(500, { "Content-Type": "text/plain" });
            }
            this.end();
        });

        stream.pipe(this);
    }
}
exports.Response = Response;
