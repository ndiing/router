const http = require("http");
const { parseQueryString } = require("../util");

/**
 * @typedef {Object} Options
 * @property {Number} [limit=1.024e+5]
 */

/**
 * @param {Options} Options
 * @returns {Callback}
 */
function urlencoded({ limit = 1.024e5 } = {}) {
    return async (req, res) => {
        if (!["POST", "PUT", "PATCH", "QUERY"].includes(req.method)) {
            return;
        }
        const contentType = req.headers["content-type"];
        if (!contentType || !contentType.includes("application/x-www-form-urlencoded")) {
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
        req.body = parseQueryString(Buffer.concat(chunks).toString("utf8"));
    };
}
exports.urlencoded = urlencoded;
