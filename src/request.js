const http = require("http");
const { parseUrl, parseQueryString } = require("./util");

class Request extends http.IncomingMessage {
    _path;
    _queryString;
    _query;
    _controller;

    get path() {
        if (!this._path) {
            const { path, queryString } = parseUrl(this.url);
            this._path = path;
            this._queryString = queryString;
        }
        return this._path;
    }

    get query() {
        if (!this._query) {
            this._query = parseQueryString(this._queryString);
        }
        return this._query;
    }

    get controller() {
        if (!this._controller) {
            this._controller = new AbortController();
        }
        return this._controller;
    }
}
exports.Request = Request;
