const fs = require("fs");
const path = require("path");
const promisify = require("util").promisify;
const rimraf = promisify(require("rimraf"));
const {
  mkdirp,
  hash,
  fstat,
  readStream,
  writeStream,
  getOptsHash
} = require("./utils");
const CachefError = require("./error");

const unlink = promisify(fs.unlink);

module.exports = async function createCache(opts = {}) {
  const dir = path.resolve(opts.dir || ".cache");
  await mkdirp(dir);

  const optsHash = getOptsHash(opts);

  return {
    _keyCache: [],

    async _getCacheKey(filename) {
      const { mtime } = await fstat(filename);
      if (this._keyCache[`${filename}:${mtime}`]) {
        return this._keyCache[`${filename}:${mtime}:${optsHash}`];
      }
      const fileContent = await readStream(filename);
      const key = `${hash(filename)}:${hash(fileContent)}:${hash(optsHash)}`;
      this._keyCache[`${filename}:${mtime}:${optsHash}`] = key;
      return key;
    },

    _getCacheFileName(key) {
      return path.join(dir, `${key}.cache`);
    },

    async set(filename, data) {
      const key = await this._getCacheKey(filename);

      if (await this.has(key)) return;

      try {
        return await writeStream(this._getCacheFileName(key), value);
      } catch (e) {
        try {
          await storage.delete(key);
        } catch (e) {}

        throw new CachefError(
          `Unable to add '${filename}' to cache.`,
          e.message,
          e.stack
        );
      }
    },

    async has(filename) {
      const key = await this._getCacheKey(filename);
      try {
        return (await fstat(this._getCacheFileName(key))).isFile();
      } catch (e) {
        return false;
      }
    },

    async get(filename) {
      const key = await this._getCacheKey(filename);
      try {
        return await readStream(this._getCacheFileName(key));
      } catch (e) {
        throw new CachefError(
          `Unable to read '${filename}' from cache.`,
          e.message,
          e.stack
        );
      }
    },

    async delete(filename) {
      const key = await this._getCacheKey(filename);
      try {
        return await unlink(this._getCacheFileName(key));
      } catch (e) {} // Ignore error
    },

    async clear() {
      try {
        await rimraf(dir);
        await mkdirp(dir);
      } catch (e) {} // Ignore error
    }
  };
};

// TODO: Cache key cache (inception O.o)
// TODO: Partially self cleaning be using file path as a directory name and remove that directory when replcaing cache
// TODO: Add flow types
// TODO: Tests
// TODO: Performance benchmark
// TODO: CI
