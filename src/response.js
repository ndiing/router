const http = require("http");
const fs = require("fs");
const path = require("path");

class Response extends http.ServerResponse {
    status(code) {
        this.statusCode = code;
        return this;
    }
    send(chunk) {
        this.setHeader("Content-Type", "text/plain; charset=utf-8");
        this.end(chunk);
    }

    json(value) {
        this.setHeader("Content-Type", "application/json; charset=utf-8");
        this.end(JSON.stringify(value));
    }

    download(filepath, filename) {
        fs.stat(filepath, (err, stats) => {
            if (err || !stats.isFile()) {
                this.statusCode = 404;
                return this.end();
            }
            filename=filename||path.basename(filepath)
            this.setHeader("Content-Type", "application/octet-stream");
            this.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
            this.setHeader("Content-Length", stats.size);
            const stream = fs.createReadStream(filepath);
            stream.on("error", (err) => {
                if (!this.headersSent) {
                    this.statusCode = 500;
                    this.end();
                }
            });
            stream.pipe(this);
        });
    }
}
exports.Response = Response;
