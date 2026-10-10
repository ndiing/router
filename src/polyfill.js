// Polyfill for Map.prototype.getOrInsert
if (!Map.prototype.getOrInsert) {
    Map.prototype.getOrInsert = function (key, defaultValue) {
        if (!this.has(key)) {
            this.set(key, defaultValue);
        }
        return this.get(key);
    };
}
