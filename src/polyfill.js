// Polyfill for Map.prototype.getOrInsert
if (!Map.prototype.getOrInsert) {
    Map.prototype.getOrInsert = function (key, defaultValue) {
        if (!this.has(key)) {
            this.set(key, defaultValue);
        }
        return this.get(key);
    };
}
// Polyfill for Map.prototype.getOrInsertComputed
if (!Map.prototype.getOrInsertComputed) {
    Map.prototype.getOrInsertComputed = function (key, callbackFunction) {
        if (typeof callbackFunction !== 'function') {
            throw new TypeError('The callback argument must be a function');
        }
        if (!this.has(key)) {
            this.set(key, callbackFunction(key));
        }
        return this.get(key);
    };
}
