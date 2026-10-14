const http = require("node:http");
const { ErrorResponse } = require("../error.js");

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
            throw ErrorResponse.status(413);
        }
        let chunkLength = 0;
        const chunks = [];
        for await (const chunk of req) {
            chunkLength += chunk.length;
            if (chunkLength > limit) {
                throw ErrorResponse.status(413);
            }
            chunks.push(chunk);
        }
        if (chunks.length === 0) {
            req.body = null;
            return;
        }
        try {
            req.body = JSON.parse(Buffer.concat(chunks), reviver);
        } catch (error) {
            throw new ErrorResponse({ statusCode: 400, message: "Invalid JSON body" }, { cause: error });
        }
    };
}

exports.json = json;
