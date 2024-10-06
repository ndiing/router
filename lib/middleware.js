const { Readable } = require("stream");
const zlib = require("zlib");
const { decode } = require("@ndiinginc/jwt");

/**
 * Middleware untuk kompresi respons berdasarkan header 'Accept-Encoding'.
 *
 * @returns {function} Middleware yang melakukan kompresi respons.
 */
function compression() {
    return (req, res, next) => {
        try {
            res.send = (body) => {
                if (typeof body === "string") {
                    const readable = new Readable();
                    readable.push(body);
                    readable.push(null);
                    body = readable;
                }
                const acceptEncoding = req.headers["accept-encoding"] ?? "";
                if (/\bbr\b/.test(acceptEncoding)) {
                    res.setHeader("Content-Encoding", "br");
                    body = body.pipe(zlib.createBrotliCompress());
                } else if (/\bgzip\b/.test(acceptEncoding)) {
                    res.setHeader("Content-Encoding", "gzip");
                    body = body.pipe(zlib.createGzip());
                } else if (/\bdeflate\b/.test(acceptEncoding)) {
                    res.setHeader("Content-Encoding", "deflate");
                    body = body.pipe(zlib.createDeflate());
                }
                body.pipe(res);
            };
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware untuk mem-parsing body permintaan pada metode POST, PATCH, dan PUT.
 *
 * @returns {function} Middleware yang mem-parsing body permintaan.
 */
function messages() {
    return async (req, res, next) => {
        try {
            const methods = ["POST", "PATCH", "PUT"];
            if (methods.includes(req.method)) {
                const chunks = [];
                for await (const chunk of req) {
                    chunks.push(chunk);
                }
                const buffer = Buffer.concat(chunks);
                const contentType = req.headers["content-type"] ?? "";
                if (contentType.includes("application/json")) {
                    req.body = JSON.parse(buffer);
                } else if (contentType.includes("application/x-www-form-urlencoded")) {
                    req.body = Object.fromEntries(new URLSearchParams(buffer.toString()).entries());
                }
            }
            next();
        } catch (error) {
            next();
        }
    };
}

/**
 * Middleware untuk mengelola cookie dalam permintaan dan respons.
 *
 * @returns {function} Middleware yang mengelola cookie.
 */
function cookies() {
    const COOKIE_ATTRIBUTES = { domain: "Domain", expires: "Expires", httpOnly: "HttpOnly", maxAge: "Max-Age", partitioned: "Partitioned", path: "Path", secure: "Secure", sameSite: "SameSite" };
    return (req, res, next) => {
        try {
            req.cookies = {};
            const cookie = req.headers["cookie"] ?? "";
            if (cookie) {
                for (const [, name, value] of cookie.matchAll(/([^= ]+)=([^;]+)/g)) {
                    req.cookies[name] = value;
                }
            }
            const setCookie = [];
            res.cookie = (name, value, attributes = {}) => {
                const array = [];
                array.push([name, value].join("="));
                for (const name in attributes) {
                    const value = attributes[name];
                    const key = COOKIE_ATTRIBUTES[name];
                    if (!key) {
                        continue;
                    }
                    array.push([key, value].join("="));
                }
                setCookie.push(array.join("; "));
                res.setHeader("Set-Cookie", setCookie);
            };
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware untuk menambahkan header keamanan pada respons.
 *
 * @returns {function} Middleware yang menambahkan header keamanan.
 */
function security() {
    return (req, res, next) => {
        try {
            const headers = { "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload", "X-XSS-Protection": "1; mode=block", "Content-Security-Policy": "default-src 'self'", "Referrer-Policy": "no-referrer" };
            for (const name in headers) {
                const value = headers[name];
                res.setHeader(name, value);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware untuk menangani permintaan CORS.
 *
 * @returns {function} Middleware yang mengatur header CORS.
 */
function cors() {
    return (req, res, next) => {
        try {
            const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Credentials": "true" };
            for (const name in headers) {
                const value = headers[name];
                res.setHeader(name, value);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware untuk mengelola otorisasi akses berdasarkan IP dan token.
 *
 * @returns {function} Middleware yang mengatur otorisasi.
 */
function authorization() {
    const permissions = [
        {
            path: "^.*$",
            matcher: "^(127\\.0\\.0\\.1|10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|192\\.168\\.\\d{1,3}\\.\\d{1,3}|172\\.(1[6-9]|2[0-9]|3[0-1])\\.\\d{1,3}\\.\\d{1,3})$",
            POST: "any",
            GET: "any",
            PATCH: "any",
            DELETE: "any",
            PUT: "any",
        },
    ];

    function getPermission(pathname_, remoteAddress_, method) {
        return permissions.find((permission) => {
            return new RegExp(permission.path).test(pathname_) && new RegExp(permission.matcher).test(remoteAddress_) && permission[method];
        });
    }
    return (req, res, next) => {
        try {
            let permission = getPermission(req.pathname_, req.remoteAddress_, req.method);
            if (permission) {
                return next();
            }
            const [, token] = (req.headers["authorization"] ?? "").split(" ");
            if (!token) {
                res.statusCode = 401;
                return res.json({ message: http.STATUS_CODES[res.statusCode] });
            }
            const payload = decode(token, "your-256-bit-secret");
            if (!payload) {
                res.statusCode = 400;
                return res.json({ message: http.STATUS_CODES[res.statusCode] });
            }
            permission = getPermission(req.pathname_, payload.role, req.method);
            if (permission) {
                return next();
            }
            res.statusCode = 403;
            return res.json({ message: http.STATUS_CODES[res.statusCode] });
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware untuk mengembalikan respons 404 jika tidak ditemukan.
 *
 * @returns {function} Middleware yang mengatur respons 404.
 */
function fallback() {
    return (req, res, next) => {
        res.statusCode = 404;
        res.json({ message: "Tidak ditemukan" });
    };
}

/**
 * Middleware untuk menangani kesalahan.
 *
 * @param {Error} err - Kesalahan yang ditangkap.
 * @param {Object} req - Objek permintaan.
 * @param {Object} res - Objek respons.
 * @param {function} next - Fungsi untuk melanjutkan ke middleware berikutnya.
 */
function catchAll() {
    return (err, req, res, next) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            res.statusCode = 500;
        }
        err = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        res.json({ message: err.message });
    };
}

module.exports = { compression, messages, cookies, security, cors, authorization, fallback, catchAll };
