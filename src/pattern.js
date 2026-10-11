/**
 * @typedef {Object} PatternExec
 * @property {number} index - The zero-based index of the match in the input string.
 * @property {string} input - The original input string.
 * @property {Object.<string, string>} [groups] - Named capture groups, or undefined.
 */
class Pattern {
    constructor(input) {
        const pattern = input
            .replace(/[.+*?^${}()|[\]\\]/g, "\\$&")
            .replace(/:(\w+)/g, "(?<$1>[^/]+)")
            .replace(/\\\*/g, ".*");

        Object.defineProperty(this, "re", {
            value: new RegExp(`^${pattern}$`),
            writable: true,
            enumerable: false,
            configurable: true,
        });
    }

    test(input) {
        return this.re.test(input);
    }

    /**
     * @param {String} input
     * @returns {PatternExec | null}
     */
    exec(input) {
        return this.re.exec(input);
    }
}
exports.Pattern = Pattern;
