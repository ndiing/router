const { IncomingMessage } = require("node:http");
const { parseUrl, parseQueryString, parseCookie } = require("./util");

class Request extends IncomingMessage {
    _path;
    _queryString;
    _query;
    _controller;
    _cookies;

    get controller() {
        if (!this._controller) this._controller = new AbortController();
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
        if (!this._query) this._query = parseQueryString(this._queryString);
        return this._query;
    }

    get cookies() {
        if (!this._cookies) {
            const cookie = this.headers.cookie;
            this._cookies = cookie ? parseCookie(cookie) : Object.create(null);
        }
        return this._cookies;
    }

    get secure() {
        return this.socket.encrypted ? true : false;
    }

    get ip() {
        return this.socket.remoteAddress;
    }
}

exports.Request = Request;
