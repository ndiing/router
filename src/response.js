const { ServerResponse } = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { buildCookie } = require("./util");

class Response extends ServerResponse {
    done = false;

    /**
     * @override
     */
    end(...args) {
        this.done = true;
        return super.end(...args);
    }

    /**
     *
     * @param {Number} code
     * @returns {this}
     */
    status(code) {
        this.statusCode = code;
        return this;
    }

    /**
     *
     * @param {String} chunk
     */
    send(chunk) {
        return this.end(chunk);
    }

    /**
     *
     * @param {Object} value
     */
    json(value) {
        this.setHeader("Content-Type", "application/json");
        return this.end(JSON.stringify(value));
    }

    /**
     *
     * @param {String} filePath
     * @param {String} [fileName]
     */
    download(filePath, fileName) {
        if (!fileName) {
            fileName = path.basename(filePath);
        }

        this.setHeader("Content-Type", "application/octet-stream");
        this.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

        const stream = fs.createReadStream(filePath);
        stream.on("error", () => {
            if (!this.headersSent) {
                this.status(500);
                this.end();
            }
        });
        this.req.on("error", () => {
            stream.destroy();
        });
        stream.pipe(this);

        this.done = true;
    }

    /**
     *
     * @param {String|Object} name
     * @param {String} value
     * @returns {this}
     */
    cookie(name, value) {
        const cookie = buildCookie(name, value);
        this.appendHeader("Set-Cookie", cookie);
        return this;
    }
}

exports.Response = Response;
