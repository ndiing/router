const URL_REGEX = /^([^?#]*)(\?([^#]*))?(#.*)?$/;
const QUERY_STRING_REGEX = /([^=&]*)?=([^&]*)?/g;

function parseQueryString(queryString) {
    const result = {};

    let match;
    while ((match = QUERY_STRING_REGEX.exec(queryString)) !== null) {
        const [, name = "", raw = ""] = match;

        const value = decodeURIComponent(raw);

        if (result[name]) {
            if (Array.isArray(result[name])) result[name].push(value);
            else result[name] = [result[name], value];
        } else result[name] = value;
    }

    return result;
}
exports.parseQueryString = parseQueryString;

function parseUrl(url) {
    const [, path = "/", , queryString = ""] = URL_REGEX.exec(url);
    return { path, queryString };
}
exports.parseUrl = parseUrl;
