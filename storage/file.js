const fs = require("fs");
const path = require("path");
const promisify = require("util").promisify;
const stream = require("stream");
const rimraf = promisify(require("rimraf"));
const { mkdirp, fstat, readStream } = require("../utils");

const unlink = promisify(fs.unlink);

const CHUNK_SIZE = 500;

function strToStream(str, chunkSize) {
  const strStream = stream.PassThrough();
  const writeToStream = pos => {
    if (pos >= str.length) return strStream.end();
    strStream.write(str.substr(pos, chunkSize));
    process.nextTick(() => writeToStream(pos + chunkSize));
  };
  writeToStream(0);
  return strStream;
}

function writeStream(filename, content) {
  return new Promise(resolve => {
    const stream = fs.createWriteStream(filename);
    const strStream = strToStream(content, CHUNK_SIZE);
    strStream.pipe(stream);
    strStream.on("end", () => {
      stream.end();
      resolve();
    });
  });
}

module.exports = async function createFileStorage(opts) {
  const dir = path.resolve(opts.dir || ".cache");
  await mkdirp(dir);

  return {
    async set(key, value) {
      if (await this.has(key)) return;
      return await writeStream(this._getCacheFileName(key), value);
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
      return await readStream(this._getCacheFileName(key));
    },

    async delete(key) {
      return await unlink(this._getCacheFileName(key));
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
