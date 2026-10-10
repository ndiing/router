class Pattern {
    static baseURL = "http://localhost";

    constructor(input) {
        const regexStr = input
            .replace(/[.+*?^${}()|[\]\\]/g, "\\$&")
            .replace(/:(\w+)/g, "(?<$1>[^/]+)")
            .replace(/\\\*/g, ".*");
        this.regex = new RegExp(`^${regexStr}$`);
    }

    exec(input) {
        const match = this.regex.exec(input);
        if (!match) return null;
        return {
            pathname: { groups: match.groups || {} },
        };
    }

    test(input) {
        return this.regex.test(input);
    }
}
exports.Pattern = Pattern;
