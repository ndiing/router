const http = require("http");
const { Readable } = require("stream");
const zlib = require("zlib");

// security

// cors

// cookies

// compression

// messages

// authentication
// authorization
// auth

// missing

// catchAll

/**
 * @module middleware
 */

/**
 * Middleware untuk menambahkan header keamanan pada respons HTTP.
 * Header yang ditambahkan meliputi:
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Content-Security-Policy
 * - Strict-Transport-Security
 * - Referrer-Policy
 *
 * @memberof module:middleware
 * @returns {Function} Middleware Express untuk menambahkan header keamanan.
 */
function security() {
    return (req, res, next) => {
        try {
            const headers = {
                "X-Content-Type-Options": "nosniff", // Mencegah MIME type sniffing
                "X-Frame-Options": "DENY", // Mencegah clickjacking
                "X-XSS-Protection": "1; mode=block", // Mengaktifkan perlindungan XSS
                "Content-Security-Policy": "default-src 'self'", // Mengatur kebijakan konten
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains", // Mengharuskan HTTPS
                "Referrer-Policy": "no-referrer", // Mengontrol informasi referrer
            };

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
 * Middleware untuk menangani Cross-Origin Resource Sharing (CORS).
 * Mengatur header CORS seperti:
 * - Access-Control-Allow-Origin
 * - Access-Control-Allow-Methods
 * - Access-Control-Allow-Headers
 * - Access-Control-Allow-Credentials
 *
 * @memberof module:middleware
 * @returns {Function} Middleware Express untuk menangani CORS.
 */
function cors() {
    return (req, res, next) => {
        try {
            const headers = {
                "Access-Control-Allow-Origin": "*", // Mengizinkan semua origin. Ganti '*' dengan domain tertentu jika perlu.
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", // Metode HTTP yang diizinkan
                "Access-Control-Allow-Headers": "Content-Type, Authorization", // Header yang diizinkan
                "Access-Control-Allow-Credentials": "true", // Izinkan pengiriman cookie
            };

            for (const name in headers) {
                const value = headers[name];
                res.setHeader(name, value);
            }

            // // Jika permintaan adalah preflight (OPTIONS), kirimkan response
            // if (req.method === 'OPTIONS') {
            //     return res.sendStatus(204);
            // }
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware untuk memparsing cookie dari permintaan HTTP dan memungkinkan pengaturan cookie dalam respons.
 *
 * @memberof module:middleware
 * @returns {Function} Middleware Express untuk menangani cookie.
 */
function cookies() {
    const COOKIE_ATTRIBUTES = {
        expires: "Expires",
        maxAge: "Max-Age",
        domain: "Domain",
        path: "Path",
        secure: "Secure",
        httpOnly: "HttpOnly",
        sameSite: "SameSite",
    };

    return (req, res, next) => {
        try {
            req.cookies = {};

            const cookie = req.headers["cookie"] || "";
            if (cookie) {
                for (const [, name, value] of cookie.matchAll(/([^=\s]+)=([^;]+)/g)) {
                    req.cookies[name] = value;
                }
            }

            const setCookie = [];
            res.cookie = function (name, value, attributes = {}) {
                const array = [];
                array.push([name, value].join("="));
                for (const key in attributes) {
                    const value = attributes[key];
                    const name = COOKIE_ATTRIBUTES[key];
                    if (!name) {
                        continue;
                    }
                    array.push([name, value].join("="));
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
 * Middleware untuk mengompresi respons HTTP menggunakan Brotli, gzip, atau deflate.
 * Menyesuaikan dengan header "Accept-Encoding" dari permintaan.
 *
 * @memberof module:middleware
 * @returns {Function} Middleware Express untuk mengompresi respons.
 */
function compression() {
    return (req, res, next) => {
        try {
            // const send = res.send;
            // res.send = function () {
            //     res.removeHeader("X-Powered-By");
            //     send.apply(this, arguments);
            // };
            const send = res.send;

            res.send = function (body) {
                if (!(body instanceof Readable)) {
                    const readable = new Readable();
                    readable.push(body);
                    readable.push(null);

                    body = readable;
                }

                const acceptEncoding = req.headers["accept-encoding"] || "";
                if (/\bbr\b/.test(acceptEncoding)) {
                    body = body.pipe(zlib.createBrotliCompress());

                    res.setHeader("Content-Encoding", "br");
                } else if (/\bgzip\b/.test(acceptEncoding)) {
                    body = body.pipe(zlib.createGzip());

                    res.setHeader("Content-Encoding", "gzip");
                } else if (/\bdeflate\b/.test(acceptEncoding)) {
                    body = body.pipe(zlib.createDeflate());

                    res.setHeader("Content-Encoding", "deflate");
                }

                res.removeHeader("X-Powered-By");

                body.pipe(res);
            };

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware untuk memparsing isi dari body permintaan POST, PATCH, atau PUT.
 * Mendukung parsing untuk content-type "application/json" dan "application/x-www-form-urlencoded".
 *
 * @memberof module:middleware
 * @returns {Function} Middleware Express untuk menangani body dari permintaan.
 */
function messages() {
    return async (req, res, next) => {
        try {
            if (["POST", "PATCH", "PUT"].includes(req.method)) {
                const chunks = [];

                for await (const chunk of req) {
                    chunks.push(chunk);
                }

                const buffer = Buffer.concat(chunks);

                const contentType = req.headers["content-type"];

                if (/^application\/json/.test(contentType)) {
                    req.body = JSON.parse(buffer);
                } else if (/^application\/x-www-form-urlencoded/.test(contentType)) {
                    req.body = Object.fromEntries(new URLSearchParams(buffer.toString()).entries());
                }
            }

            // // test
            // console.log(req.body)
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Middleware untuk mengatur autentikasi berdasarkan izin yang diberikan.
 * Memeriksa token Bearer di header Authorization.
 *
 * @memberof module:middleware
 * @param {Array<Object>} permissions - Daftar izin yang memperbolehkan akses berdasarkan path, metode, dan alamat IP.
 * @returns {Function} Middleware Express untuk menangani autentikasi.
 */
function auth(permissions) {
    permissions = permissions || [];

    function getPermission(pathname, remoteAddress, method) {
        return permissions.find((permission) => {
            return new RegExp(permission.path).test(pathname) && new RegExp(permission.matcher).test(remoteAddress) && permission[method];
        });
    }

    function decode(token, secret) {}

    return (req, res, next) => {
        try {
            let permission = getPermission(req._parsedUrl.pathname, req.socket.remoteAddress, req.method);
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

            permission = getPermission(req._parsedUrl.pathname, payload.role, req.method);
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
 * Middleware untuk menangani rute yang tidak ditemukan (404).
 *
 * @memberof module:middleware
 * @returns {Function} Middleware Express untuk menangani kesalahan 404.
 */
function missing() {
    return (req, res, next) => {
        res.status(404);
        next(new Error(http.STATUS_CODES[404]));
    };
}

/**
 * Middleware untuk menangani semua error yang tidak tertangani.
 * Mengembalikan error dalam bentuk JSON.
 *
 * @memberof module:middleware
 * @param {Error} err - Objek error yang terjadi.
 * @returns {Function} Middleware Express untuk menangani error.
 */
function catchAll() {
    return (err, req, res, next) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            res.status(500);
        }
        err = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        res.json(err);
    };
}

module.exports = {
    security,
    cors,
    cookies,
    compression,
    messages,
    auth,
    missing,
    catchAll,
};
