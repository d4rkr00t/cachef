const fs = require("fs");
const path = require("path");
const promisify = require("util").promisify;
const rimraf = promisify(require("rimraf"));
const unlink = promisify(fs.unlink);
const { mkdirp, hash, fstat, checksum, readStream, writeStream, getOptsHash } = require("./utils");
const CachefError = require("./error");

// Write N characters per iteration, then unblock the thread
const WRITE_CHUNK_SIZE = 500;

module.exports = async function createCache(opts = {}) {
  const optsHash = getOptsHash(opts);
  const dir = path.resolve(opts.dir || ".cache");
  const { prefix = "" } = opts;

  await mkdirp(dir);

  return {
    async _getCacheKey(filename) {
      const chsm = await checksum(filename);
      return `${prefix}${hash(filename)}:${chsm}:${hash(optsHash)}`;
    },

    _getCacheFileName(key) {
      return path.join(dir, `${key}.cache`);
    },

    async set(filename, value) {
      if (await this.has(filename)) return;

      const key = await this._getCacheKey(filename);
      try {
        return await writeStream(WRITE_CHUNK_SIZE, this._getCacheFileName(key), value);
      } catch (e) {
        try {
          await this.delete(filename);
        } catch (e) {}

        throw new CachefError(`Unable to add '${filename}' to cache.`, e.message, e.stack);
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
        throw new CachefError(`Unable to read '${filename}' from cache.`, e.message, e.stack);
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
// TODO: Add flow types
// TODO: Tests
// TODO: Clean up everything
// TODO: Performance benchmark
// TODO: CI
