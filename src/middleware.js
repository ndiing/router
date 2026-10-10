const http = require("node:http");

function json({ limit = 100 * 1024 } = {}) {
    const reviver = (key, value) => {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
            return undefined;
        }
        return value;
    };

    return async (req, res) => {
        if (!["POST", "PUT", "PATCH", "QUERY"].includes(req.method)) {
            return;
        }

        const contentType = req.headers["content-type"];
        if (!contentType || !contentType.includes("application/json")) {
            return;
        }

        const contentLength = parseInt(req.headers["content-length"], 10);
        if (contentLength && contentLength > limit) {
            res.statusCode = 413;
            throw new Error(http.STATUS_CODES[res.statusCode]);
        }

        let bodySize = 0;
        const chunks = [];
        for await (const chunk of req) {
            bodySize += chunk.length;
            if (bodySize > limit) {
                res.statusCode = 413;
                throw new Error(http.STATUS_CODES[res.statusCode]);
            }
            chunks.push(chunk);
        }

        if (chunks.length === 0) {
            req.body = null;
            return;
        }

        const rawBody = Buffer.concat(chunks).toString("utf8");
        try {
            req.body = JSON.parse(rawBody, reviver);
        } catch (error) {
            res.statusCode = 400;
            throw new Error("Invalid JSON body");
        }
    };
}
module.exports.json = json;
