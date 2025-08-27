const store = new Map();

export function getCache(key) {
  const hit = store.get(key);
  if (!hit) return null;
  const { value, expires } = hit;
  if (expires && Date.now() > expires) {
    store.delete(key);
    return null;
  }
  return value;
}

export function setCache(key, value, ttlSeconds = 300) {
  const expires = ttlSeconds ? Date.now() + ttlSeconds*1000 : null;
  store.set(key, { value, expires });
}

export function wrapCache(key, ttlSeconds, fn) {
  return async (...args) => {
    const k = key + JSON.stringify(args);
    const cached = getCache(k);
    if (cached) return cached;
    const v = await fn(...args);
    setCache(k, v, ttlSeconds);
    return v;
  };
}
