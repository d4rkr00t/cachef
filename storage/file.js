const fs = require("fs");
const path = require("path");
const promisify = require("util").promisify;
const rimraf = promisify(require("rimraf"));
const { mkdirp, fstat } = require("../utils");

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

module.exports = async function createFileStorage() {
  return {
    async init({ dir }) {
      this.dir = path.resolve(dir || ".cache");
      await mkdirp(this.dir);
    },

    async set(key, value) {
      return await writeFile(this._getCacheFileName(key), value);
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
      try {
        return unlink(this._getCacheFileName(key));
      } catch (e) {}
    },

    async clear() {
      await rimraf(this.dir);
      await mkdirp(this.dir);
    },

    _getCacheFileName(key) {
      return path.join(this.dir, `${key}.cache`);
    }
  };
};
