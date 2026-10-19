function decodeQueryParam(encoded) {
    const normalize = encoded.replace(/\+/g, " ");
    try {
        return decodeURIComponent(normalize);
    } catch (error) {
        return normalize;
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

exports.decodePathParam = decodePathParam;

function parseQueryString(queryString) {
    const query = Object.create(null);
    if (!queryString) return query;
    const regex = /([^=&]*)?=([^&]*)?/g;
    let match;
    while ((match = regex.exec(queryString))) {
        const [, rawName = "", rawValue = ""] = match;
        const name = decodeQueryParam(rawName);
        const value = decodeQueryParam(rawValue);
        if (Object.hasOwn(query, name)) {
            if (Array.isArray(query[name])) query[name].push(value);
            else query[name] = [query[name], value];
        } else {
            query[name] = value;
        }
    }
    return query;
}
exports.parseQueryString = parseQueryString;

function parseUrl(url) {
    const regex = /^([^?#]*)(\?([^#]*))?(#.*)?$/;
    const [, path = "/", , queryString = ""] = regex.exec(url);
    return { path: path || "/", queryString };
}
exports.parseUrl = parseUrl;
