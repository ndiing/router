/**
 * @typedef PatternExecResult
 * @property {number} index
 * @property {string} input
 * @property {Record<string, string>} [groups]
 * @property {number} length
 */
class Pattern {
    constructor(input) {
        const pattern = `^${input
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            .replace(/:(\w+)/g, "(?<$1>[^/]+)")
            .replace(/\*/, ".*")}$`;
        Object.defineProperty(this, "regex", {
            value: new RegExp(pattern),
            configurable: true,
            enumerable: false,
        });
    }
    
    /**
     * @param {string} input
     * @returns {PatternExecResult | null}
     */
    exec(input) {
        return this.regex.exec(input);
    }

    test(input) {
        return this.regex.test(input);
    }
}

exports.Pattern = Pattern;
