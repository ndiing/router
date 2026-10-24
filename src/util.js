const EMPTY_PARAMS = Object.create(null);
exports.EMPTY_PARAMS = EMPTY_PARAMS;

/**
 * @param {String} raw
 * @returns {String}
 */
function decodeParam(raw) {
    try {
        return decodeURIComponent(raw);
    } catch (error) {
        return raw;
    }
}
exports.decodeParam = decodeParam;

/**
 * @param {String} raw
 * @returns {String}
 */
function decodeQuery(raw) {
    const normalized = raw.replace(/\+/g, " ");
    try {
        return decodeURIComponent(normalized);
    } catch (error) {
        return normalized;
    }
}

/**
 * @param {String} queryString
 * @returns {Object}
 */
function parseQueryString(queryString) {
    if (queryString === "") return Object.create(null);
    const regex = /([^=&]*)=([^&]*)/g;
    const result = Object.create(null);
    let match;
    while ((match = regex.exec(queryString))) {
        const [, rawName, rawValue] = match;
        const name = decodeQuery(rawName);
        const value = decodeQuery(rawValue);
        if (Object.hasOwn(result, name)) {
            if (Array.isArray(result[name])) result[name].push(value);
            else result[name] = [result[name], value];
        } else result[name] = value;
    }

    return result;
}
exports.parseQueryString = parseQueryString;

/**
 * @param {String} url
 * @returns {{path: any;queryString: any;}}
 */
function parseUrl(url) {
    if (!(url.includes("?") || url.includes("#"))) {
        return { path: url, queryString: "" };
    }
    const regex = /^([^?#]*)(\?([^#]*))?(#.*)?$/;
    const [, path = "/", , queryString = ""] = regex.exec(url);
    return { path, queryString };
}
exports.parseUrl = parseUrl;
