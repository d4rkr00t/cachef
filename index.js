const createFileStorage = require("./storage/file");
const { md5, fstat } = require("./utils");
const CachefError = require("./error");

module.exports = async function createCache(opts = {}, storage) {
  storage = storage || (await createFileStorage(opts));

  const optsHash = Object.keys(opts).reduce((acc, key) => `${acc};${key}:${String(opts[key])}`, "");

  return {
    async _getCacheKey(filename) {
      const { mtime } = await fstat(filename);
      return md5(`${filename}:${optsHash}:${mtime}`);
    },

    async set(filename, data) {
      const key = await this._getCacheKey(filename);
      try {
        await storage.set(key, data);
        if (storage.onUpdate) {
          await storage.onUpdate("set", key);
        }
      } catch (e) {
        throw new CachefError(`Unable to add '${filename}' to cache.`, e.message, e.stack);
      }
    },

    async has(filename) {
      const key = await this._getCacheKey(filename);
      return await storage.has(key);
    },

    async get(filename) {
      const key = await this._getCacheKey(filename);
      try {
        return await storage.get(key);
      } catch (e) {
        throw new CachefError(`Unable to read '${filename}' from cache.`, e.message, e.stack);
      }
    },

    async delete(filename) {
      const key = await this._getCacheKey(filename);
      try {
        await storage.delete(key);
        if (storage.onUpdate) {
          await storage.onUpdate("delete", key);
        }
      } catch (e) {} // Ignore error
    },

    async clear() {
      try {
        await storage.clear();
        if (storage.onUpdate) {
          await storage.onUpdate("clear", key);
        }
      } catch (e) {} // Ignore error
    }
  };
};
