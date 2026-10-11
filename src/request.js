const http = require("node:http");

class Request extends http.IncomingMessage {
    static base = "http://127.0.0";

    get path() {
        if (this._path) return this._path;

        if (this.url === "/") {
            this._path = this.url;
            return this._path;
        }

        this.parsed = URL.parse(this.url, Request.base);
        this._path = this.parsed.pathname;
        return this._path;
    }

    get query() {
        if (this._query) return this._query;

        if (!this.parsed) {
            this._query = {};
            return this._query;
        }

        const query = {};
        for (const [name, value] of this.parsed.searchParams) {
            if (query[name]) {
                if (Array.isArray(query[name])) {
                    query[name].push(value);
                } else {
                    query[name] = [query[name], value];
                }
            } else {
                query[name] = value;
            }
        }
        this._query = query;
        return this._query;
    }
}
exports.Request = Request;
