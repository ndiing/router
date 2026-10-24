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
 * @param {String} url
 * @returns {{path: any;queryString: any;}}
 */
function parseUrl(url) {
    let path = url;
    let queryString = "";
    let hash = "";
    if (url.includes("?") || url.includes("#")) {
        const hashIdx = url.indexOf("#");
        if (hashIdx !== -1) {
            hash = url.slice(hashIdx + 1);
            path = url.slice(0, hashIdx);
        }
        const queryIdx = path.indexOf("?");
        if (queryIdx !== -1) {
            queryString = path.slice(queryIdx + 1);
            path = path.slice(0, queryIdx);
        }
    }
    return { path, queryString, hash };
}
exports.parseUrl = parseUrl;
