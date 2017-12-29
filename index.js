const createFileStorage = require("./storage/file");
const { md5, fstat } = require("./utils");

module.exports = async function createCache(
  opts = {},
  storage = createFileStorage()
) {
  await storage.init(opts); // ????
  const optsHash = Object.keys(opts).reduce(
    (acc, key) => `${acc};${key}:${String(opts[key])}`,
    ""
  );

  return {
    async _getCacheKey(filename) {
      const { mtime } = await fstat(filename);
      const hash = md5(`${filename}:${optsHash}:${mtime}`);
    },

    async set(filename, data) {
      const key = await this._getCacheKey(filename);
      return await storage.set(key, data);
    },

    async has(filename) {
      const key = await this._getCacheKey(filename);
      return await storage.has(key);
    },

    async get(filename) {
      const key = await this._getCacheKey(filename);
      return await storage.get(key);
    },

    async delete(filename) {
      const key = await this._getCacheKey(filename);
      return await storage.delete(key);
    },

    async clear() {
      return await storage.clear();
    }
  };
};
