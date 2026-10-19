/**
 * @typedef CORSOptions
 * @property {String} [origin="*"]
 * @property {Boolean} [credentials=false]
 * @property {String|Array} headers
 * @property {Number} [maxAge=0]
 * @property {String|Array} methods
 */

/**
 * @param {CORSOptions} options
 */
function cors({ origin = "*", credentials = false, headers, maxAge = 0, methods } = {}) {
    if (headers && Array.isArray(headers)) {
        headers = headers.map((header) => header.toLowerCase());
    }
    if (methods && Array.isArray(methods)) {
        methods = methods.map((method) => method.toUpperCase());
    }

    /**
     * @param {import('http').ServerResponse} res
     */
    function setAllowCredentials(res) {
        if (credentials) {
            res.setHeader("Access-Control-Allow-Credentials", "true");
        }
    }

    /**
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     */
    function setAllowHeaders(req, res) {
        let reqHeaders = req.headers["access-control-request-headers"];
        if (!reqHeaders) return;
        reqHeaders = reqHeaders.split(",").map((header) => header.trim().toLowerCase());
        let value;
        if (headers === "*" && !credentials) {
            value = "*";
        } else if (Array.isArray(headers) && reqHeaders.every((reqHeader) => headers.some((header) => header === reqHeader))) {
            value = headers;
        }
        if (value) res.setHeader("Access-Control-Allow-Headers", value);
    }

    /**
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     */
    function setAllowMethods(req, res) {
        const reqMethod = req.headers["access-control-request-method"];
        if (!reqMethod) return;
        let value;
        if (methods === "*" && !credentials) {
            value = "*";
        } else if (Array.isArray(methods) && methods.some((method) => method === reqMethod.toUpperCase())) {
            value = methods;
        }
        if (value) res.setHeader("Access-Control-Allow-Methods", value);
    }

    /**
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     */
    function setAllowOrigin(req, res, preflight = true) {
        const reqOrigin = req.headers["origin"];

        let value;
        let explicit;
        if (origin === "*" && !credentials) {
            value = "*";
        } else if (origin === null) {
            value = "null";
        } else if (origin === "*" || origin === reqOrigin || (Array.isArray(origin) && origin.some((origin) => origin === reqOrigin))) {
            value = reqOrigin;
            explicit = true;
        }
        if (value) res.setHeader("Access-Control-Allow-Origin", value);
        if (!preflight && explicit) res.appendHeader("Vary", "Origin");
    }

    /**
     * @param {import('http').ServerResponse} res
     */
    function setExposeHeaders(res) {
        let value;
        if (headers === "*" && !credentials) {
            value = "*";
        } else if (Array.isArray(headers)) {
            value = headers;
        }
        if (value) res.setHeader("Access-Control-Expose-Headers", value);
    }

    /**
     * @param {import('http').ServerResponse} res
     */
    function setMaxAge(res) {
        if (maxAge > 0) {
            res.setHeader("Access-Control-Max-Age", maxAge);
        }
    }

    /**
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     */
    return (req, res) => {
        setAllowCredentials(res);
        if (req.method === "OPTIONS") {
            setAllowOrigin(req, res);
            setAllowHeaders(req, res);
            setAllowMethods(req, res);
            setMaxAge(res);
            res.statusCode = 204;
            res.setHeader("Content-Length", "0");
            res.end();
        } else {
            setAllowOrigin(req, res, false);
            setExposeHeaders(res);
        }
    };
}
exports.cors = cors;
