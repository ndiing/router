const http = require("node:http");
const { parseUrl, parseQueryString } = require("./util.js");

class Request extends http.IncomingMessage {
    _path;
    _parsed;
    _query;
    params = {};
    signal;
    get path() {
        if (this._path) return this._path;
        if (!/[?#]/.test(this.url)) {
            this._path = this.url;
            return this._path;
        }
        this._parsed = parseUrl(this.url);
        this._path = this._parsed.path;
        return this._path;
    }

    get query() {
        if (this._query) return this._query;
        if (!this._parsed) {
            this._query = {};
            return this._query;
        }
        this._query = parseQueryString(this._parsed.queryString);
        return this._query;
    }
}

exports.Request = Request;
