const fs = require("fs");
const path = require("path");
const promisify = require("util").promisify;
const rimraf = promisify(require("rimraf"));
const { mkdirp, fstat } = require("../utils");

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

module.exports = async function createFileStorage(opts) {
  const dir = path.resolve(opts.dir || ".cache");
  await mkdirp(dir);

  return {
    async set(key, value) {
      return await writeFile(this._getCacheFileName(key), value);
    },

    async onUpdate(type, key) {
      // noop
    },

    async has(key) {
      try {
        return (await fstat(this._getCacheFileName(key))).isFile();
      } catch (e) {
        return false;
      }
    },

    async get(key) {
      return readFile(this._getCacheFileName(key), "utf8");
    },

    async delete(key) {
      return unlink(this._getCacheFileName(key));
    },

    async clear() {
      await rimraf(dir);
      await mkdirp(dir);
    },

    _getCacheFileName(key) {
      return path.join(dir, `${key}.cache`);
    }
  };
};
