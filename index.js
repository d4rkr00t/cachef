const fs = require("fs");
const path = require("path");
const promisify = require("util").promisify;
const rimraf = promisify(require("rimraf"));
const unlink = promisify(fs.unlink);
const {
  mkdirp,
  hash,
  fstat,
  readStream,
  writeStream,
  getOptsHash
} = require("./utils");
const CachefError = require("./error");

// Write N characters per iteration, then unblock the thread
const WRITE_CHUNK_SIZE = 500;

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

    async set(filename, value) {
      if (await this.has(filename)) return;

      const key = await this._getCacheKey(filename);
      try {
        return await writeStream(
          WRITE_CHUNK_SIZE,
          this._getCacheFileName(key),
          value
        );
      } catch (e) {
        try {
          await this.delete(filename);
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

// TODO: Cache prefix
// TODO: Cache key cache (inception O.o)
// TODO: Add flow types
// TODO: Tests
// TODO: Performance benchmark
// TODO: CI
