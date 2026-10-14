function pattern(string) {
    return new RegExp(
        `^(${String(string)
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/ /g, "")
            .replace(/,/g, "|")
            .replace(/\\\*/g, ".*")})$`,
        "i",
    );
}

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
    const HEADERS_PATTERN = headers && pattern(headers);
    const METHODS_PATTERN = methods && pattern(methods);
    const ORIGIN_PATTERN = pattern(origin);

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
        const reqHeaders = req.headers["access-control-request-headers"];
        if (!reqHeaders) return;
        let value;
        if (headers === "*" && !credentials) {
            value = "*";
        } else if (Array.isArray(headers) && HEADERS_PATTERN && HEADERS_PATTERN.test(reqHeaders)) {
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
        } else if (Array.isArray(methods) && METHODS_PATTERN && METHODS_PATTERN.test(reqMethod)) {
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
        } else if (ORIGIN_PATTERN.test(reqOrigin)) {
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
