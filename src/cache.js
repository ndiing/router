class Cache {
    constructor(size) {
        this.size = size;
        this.map = new Map();
    }

    get(key) {
        if (!this.map.has(key)) return undefined;
        const value = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, value);
        return value;
    }

    set(key, value) {
        if (this.map.has(key)) this.map.delete(key);
        else if (this.map.size >= this.size) {
            this.map.delete(this.map.keys().next().value);
        }
        this.map.set(key, value);
    }
}

exports.Cache = Cache;
