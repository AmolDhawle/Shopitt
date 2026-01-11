const store = new Map<string, string>();

export const redis = {
  get: jest.fn((key: string) => {
    return Promise.resolve(store.get(key) ?? null);
  }),

  set: jest.fn((key: string, value: string, mode?: string, ttl?: number) => {
    store.set(key, value);
    return Promise.resolve("OK");
  }),

  del: jest.fn((key: string) => {
    store.delete(key);
    return Promise.resolve(1);
  }),

  incr: jest.fn((key: string) => {
    const value = Number(store.get(key) ?? 0) + 1;
    store.set(key, value.toString());
    return Promise.resolve(value);
  }),

  expire: jest.fn((_key: string, _ttl: number) => {
    return Promise.resolve(1);
  }),
};

export const resetRedisStore = () => {
  store.clear();
  jest.clearAllMocks();
};
