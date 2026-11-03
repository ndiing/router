const { IncomingMessage } = require("node:http");
const { parseUrl, parseQueryString, parseCookie } = require("./util");

class Request extends IncomingMessage {
    _path;
    _queryString;
    _query;
    _controller;

    _cookies;

    /**
     *
     * @readonly
     * @type {AbortController}
     */
    get controller() {
        if (!this._controller) {
            this._controller = new AbortController();
        }
        return this._controller;
    }

    /**
     *
     * @readonly
     * @type {String}
     */
    get path() {
        if (!this._path) {
            const result = parseUrl(this.url);
            this._path = result.path;
            this._queryString = result.queryString;
        }
        return this._path;
    }

    /**
     *
     * @readonly
     * @type {Object}
     */
    get query() {
        if (!this._query) {
            this._query = parseQueryString(this._queryString);
        }
        return this._query;
    }

    /**
     *
     * @readonly
     * @type {Object}
     */
    get cookies() {
        if (!this._cookies) {
            const cookie = this.headers.cookie;
            this._cookies = cookie ? parseCookie(cookie) : Object.create(null);
        }
        return this._cookies;
    }
}

exports.Request = Request;
