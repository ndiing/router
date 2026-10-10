const { IncomingMessage } = require("node:http");

class Request extends IncomingMessage {
    get path() {
        if (this.url.indexOf("?") !== -1) {
            this.parsed = URL.parse(this.url, "http://localhost");
            return this.parsed.pathname;
        }
        return this.url;
    }

    get query() {
        const query = {};
        if (!this.parsed) return query;
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
        return query;
    }
}
exports.Request = Request;
