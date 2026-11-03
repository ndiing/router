// =========================
// params
// =========================

/**
 *
 * @param {String} raw
 * @returns {String}
 */
function decodeParam(raw) {
    if (!raw.includes("%")) return raw; // fast path: 99% URL nggak ada encoding
    try {
        return decodeURIComponent(raw);
    } catch (error) {
        return raw;
    }
}
exports.decodeParam = decodeParam;

// =========================
// url
// =========================

/**
 *
 * @param {String} queryString
 * @returns {Object}
 */
function parseQueryString(queryString) {
    const query = Object.create(null);
    if (queryString) {
        for (const [name, value] of new URLSearchParams(queryString)) {
            if (Object.hasOwn(query, name)) {
                if (Array.isArray(query[name])) query[name].push(value);
                else query[name] = [query[name], value];
            } else query[name] = value;
        }
    }
    return query;
}
exports.parseQueryString = parseQueryString;

/**
 *
 * @param {String} url
 * @returns {{path:string;queryString:string;hash:string;}}
 */
function parseUrl(url) {
    let path = url;
    let queryString = "";
    let hash = "";
    if (url.includes("?") || url.includes("#")) {
        const hashIndex = url.indexOf("#");
        if (hashIndex !== -1) {
            hash = url.slice(hashIndex + 1);
            path = url.slice(0, hashIndex);
        }
        const queryIndex = path.indexOf("?");
        if (queryIndex !== -1) {
            queryString = path.slice(queryIndex + 1);
            path = path.slice(0, queryIndex);
        }
    }
    return { path, queryString, hash };
}
exports.parseUrl = parseUrl;

// =========================
// cookie
// =========================

function decodeCookie(val) {
    try {
        return decodeURIComponent(val);
    } catch (error) {
        return val;
    }
}
exports.decodeCookie = decodeCookie;

function encodeCookie(val) {
    try {
        return encodeURIComponent(val);
    } catch (error) {
        return val;
    }
}
exports.encodeCookie = encodeCookie;

function parseCookie(str) {
    const cookies = Object.create(null);
    if (!str) return cookies;

    let i = 0;
    const len = str.length;

    while (i < len) {
        while (i < len && str.charCodeAt(i) === 32) i++;

        let eqIdx = i;
        while (eqIdx < len && str.charCodeAt(eqIdx) !== 61) {
            if (str.charCodeAt(eqIdx) === 59) break;
            eqIdx++;
        }

        let semiIdx;
        if (eqIdx >= len || str.charCodeAt(eqIdx) !== 61) {
            semiIdx = eqIdx;
            while (semiIdx < len && str.charCodeAt(semiIdx) !== 59) semiIdx++;
            i = semiIdx + 1;
            continue;
        }

        semiIdx = eqIdx + 1;
        while (semiIdx < len && str.charCodeAt(semiIdx) !== 59) {
            semiIdx++;
        }

        const name = str.substring(i, eqIdx).trim();
        if (name.length === 0) {
            i = semiIdx + 1;
            continue;
        }

        const val = str.substring(eqIdx + 1, semiIdx).trim();
        const key = decodeCookie(name);
        const value = decodeCookie(val);
        if (Object.hasOwn(cookies, key)) {
            if (Array.isArray(cookies[key])) cookies[key].push(value);
            else cookies[key] = [cookies[key], value];
        } else {
            cookies[key] = value;
        }

        i = semiIdx + 1;
    }

    return cookies;
}
exports.parseCookie = parseCookie;

function isValidCookieName(name) {
    return /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name);
}
exports.isValidCookieName = isValidCookieName;

/**
 * @typedef CookieOptions
 * @property {String} domain
 * @property {Number} expires - Unix time milliseconds
 * @property {Number} maxAge - seconds
 * @property {Boolean} partitioned
 * @property {String} [path="/"]
 * @property {String} [sameSite="Lax"]
 * @property {Boolean} httpOnly
 * @property {Boolean} secure
 */

/**
 *
 * @param {*} name
 * @param {*} value
 * @returns {String}
 */
function buildCookie(name, value) {
    const options = typeof name === "object" ? name : { name, value };
    if (!isValidCookieName(options.name)) {
        throw new Error("Invalid Cookie Name");
    }
    if (options.value === undefined || options.value === null) {
        throw new Error("Cookie value is required");
    }
    const { domain = null, expires = null, maxAge = null, partitioned = false, path = "/", sameSite = "Lax", httpOnly = false, secure = false } = options;
    const arr = [`${encodeCookie(options.name)}=${encodeCookie(options.value)}`];
    if (domain !== null) arr.push(`Domain=${domain}`);
    if (expires !== null) arr.push(`Expires=${new Date(expires).toUTCString()}`);
    if (maxAge !== null) arr.push(`Max-Age=${maxAge}`);
    if (partitioned) arr.push(`Partitioned`);
    if (path) arr.push(`Path=${path}`);
    if (sameSite) arr.push(`SameSite=${sameSite}`);
    if (httpOnly) arr.push(`HttpOnly`);
    if (secure) arr.push(`Secure`);
    return arr.join("; ");
}
exports.buildCookie = buildCookie;
