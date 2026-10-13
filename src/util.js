const URL_REGEX = /^([^?#]*)(\?([^#]*))?(#.*)?$/;
const QUERY_STRING_REGEX = /([^=&]*)?=([^&]*)?/g;

function parseQueryString(queryString) {
    const result = Object.create(null);

    let match;
    while ((match = QUERY_STRING_REGEX.exec(queryString)) !== null) {
        const [, rawName = "", rawValue = ""] = match;

        let name 
        try {
            name = decodeURIComponent(rawName)
        } catch (error) {
            name=rawName
        }
        
        let value 
        try {
            value = decodeURIComponent(rawValue)
        } catch (error) {
            value=rawValue
        }

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
