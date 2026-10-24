const http = require("http");
/**
 * @typedef {Object} Options
 * @property {Number} [limit=1.024e+5]
 */

/**
 * @callback Callback
 * @param {import('../request')} req
 * @param {import('../response')} res
 */

/**
 * @param {Options} Options
 * @returns {Callback}
 */
function json({ limit = 1.024e5 } = {}) {
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
        let chunkLength = 0;
        const chunks = [];
        for await (const chunk of req) {
            chunkLength += chunk.length;
            if (chunkLength > limit) {
                res.statusCode = 413;
                throw new Error(http.STATUS_CODES[res.statusCode]);
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
            res.statusCode = 400;
            throw new Error(http.STATUS_CODES[res.statusCode], { cause: error });
        }
    };
}
exports.json = json;
