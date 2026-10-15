const URL_REGEX = /^([^?#]*)(\?([^#]*))?(#.*)?$/;
const QUERY_STRING_REGEX = /([^=&]*)?=([^&]*)?/g;

function decodeQueryParam(encoded) {
    try {
        return decodeURIComponent(encoded.replace(/\+/g, " "));
    } catch (error) {
        return encoded;
    }
}
exports.decodeQueryParam = decodeQueryParam;

function decodePathParam(encoded) {
    try {
        return decodeURIComponent(encoded);
    } catch {
        return encoded;
    }
}
exports.decodePathParam=decodePathParam

function parseQueryString(queryString) {
    const result = Object.create(null);
    let match;
    while ((match = QUERY_STRING_REGEX.exec(queryString)) !== null) {
        const [, rawName = "", rawValue = ""] = match;
        const name = decodeQueryParam(rawName);
        const value = decodeQueryParam(rawValue);
        if (Object.hasOwn(result, name)) {
            if (Array.isArray(result[name])) result[name].push(value);
            else result[name] = [result[name], value];
        } else result[name] = value;
    }
    return result;
}
exports.parseQueryString = parseQueryString;

function parseUrl(url) {
    const [, rawPath = "", , queryString = ""] = URL_REGEX.exec(url);
    return { path: rawPath || "/", queryString };
}
exports.parseUrl = parseUrl;
