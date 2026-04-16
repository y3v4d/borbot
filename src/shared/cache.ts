interface CacheEntry<T> {
    value: T,
    expiresAt: number
}

class InMemoryCache<T> {
    private _cache: Map<string, CacheEntry<T>> = new Map();
    private _ttl: number;

    constructor(ttl: number = 60 * 5 * 1000) {
        this._ttl = ttl;
    }

    set(key: string, value: T, ttl: number = this._ttl) {
        const expiresAt = ttl > 0 ? Date.now() + ttl : Infinity;
        this._cache.set(key, { value, expiresAt });
    }

    // returns undefined for cache miss, null for negative cache hit, and T for positive cache hit
    get(key: string): T | null | undefined {
        if(!this._cache.has(key)) {
            return undefined;
        }

        const entry = this._cache.get(key)!;
        if(Date.now() > entry.expiresAt) {
            this._evict(key);
            return undefined;
        }

        return entry.value;
    }

    delete(key: string) {
        this._evict(key);
    }

    clear() {
        this._cache.clear();
    }

    private _evict(key: string) {
        this._cache.delete(key);
    }
}

export default InMemoryCache;