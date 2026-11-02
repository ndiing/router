const { IncomingMessage } = require("node:http");

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

class Request extends IncomingMessage {
    _path;
    _queryString;
    _query;
    _controller;

    get controller() {
        if (!this._controller) {
            this._controller = new AbortController();
        }
        return this._controller;
    }

    get path() {
        if (!this._path) {
            const result = parseUrl(this.url);
            this._path = result.path;
            this._queryString = result.queryString;
        }
        return this._path;
    }

    get query() {
        if (!this._query) {
            this._query = parseQueryString(this._queryString);
        }
        return this._query;
    }
}

exports.Request = Request;
