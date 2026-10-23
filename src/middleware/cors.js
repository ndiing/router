/**
 * @typedef CORSOptions
 * @property {String|Array|Null} [origin="*"]
 * @property {Boolean} [credentials=false]
 * @property {String|Array} [headers]
 * @property {Number} [maxAge=0]
 * @property {String|Array} [methods]
 */

/**
 * @param {CORSOptions} options
 */
function cors({ origin = "*", credentials = false, headers, maxAge = 0, methods } = {}) {
    if (Array.isArray(headers)) {
        headers = headers.map((h) => h.toLowerCase());
    }
    if (Array.isArray(methods)) {
        methods = methods.map((m) => m.toUpperCase());
    }

    function setAllowCredentials(res) {
        if (credentials) {
            res.setHeader("Access-Control-Allow-Credentials", "true");
        }
    }

    function setAllowOrigin(req, res) {
        const reqOrigin = req.headers["origin"];
        let value;
        let explicit = false;
        if (origin === "*" && !credentials) {
            value = "*";
        } else if (origin === "*" || origin === reqOrigin || (Array.isArray(origin) && origin.includes(reqOrigin))) {
            value = reqOrigin;
            explicit = true;
        }
        if (value) res.setHeader("Access-Control-Allow-Origin", value);
        if (explicit) res.appendHeader("Vary", "Origin");
    }

    function setAllowHeaders(req, res) {
        const reqHeaders = req.headers["access-control-request-headers"];
        if (!reqHeaders) return;
        const requested = reqHeaders.split(",").map((h) => h.trim().toLowerCase());
        let value;
        if (headers === "*" && !credentials) {
            value = "*";
        } else if (Array.isArray(headers)) {
            const allowed = requested.filter((h) => headers.includes(h));
            if (allowed.length === requested.length) value = headers;
        } else {
            value = requested;
        }
        if (value) res.setHeader("Access-Control-Allow-Headers", value);
    }

    function setAllowMethods(req, res) {
        const reqMethod = req.headers["access-control-request-method"];
        if (!reqMethod) return;
        const method = reqMethod.toUpperCase();
        let value;
        if (methods === "*" && !credentials) {
            value = "*";
        } else if (Array.isArray(methods)) {
            if (methods.includes(method)) value = methods;
        } else {
            value = [method];
        }
        if (value) res.setHeader("Access-Control-Allow-Methods", value);
    }

    function setExposeHeaders(res) {
        let value;
        if (headers === "*" && !credentials) {
            value = "*";
        } else if (Array.isArray(headers)) {
            value = headers;
        }
        if (value) res.setHeader("Access-Control-Expose-Headers", value);
    }

    function setMaxAge(res) {
        if (maxAge > 0) {
            res.setHeader("Access-Control-Max-Age", maxAge);
        }
    }

    return (req, res) => {
        setAllowCredentials(res);
        if (req.method === "OPTIONS" && req.headers["access-control-request-method"]) {
            setAllowOrigin(req, res);
            setAllowHeaders(req, res);
            setAllowMethods(req, res);
            setMaxAge(res);
            res.statusCode = 204;
            res.setHeader("Content-Length", "0");
            res.end();
        } else {
            setAllowOrigin(req, res);
            setExposeHeaders(res);
        }
    };
}

exports.cors = cors;
