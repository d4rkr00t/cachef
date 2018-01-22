const crypto = require("crypto");
const fs = require("fs");
const stream = require("stream");
const promisify = require("util").promisify;

const mkdirp = promisify(require("mkdirp"));
const fstat = promisify(require("fs").stat);

function hash(string) {
  return crypto
    .createHash("md5")
    .update(string)
    .digest("hex");
}

function readStream(filename) {
  return new Promise(resolve => {
    let data = "";
    const readStream = fs.createReadStream(filename, "utf8");
    readStream
      .on("data", chunk => (data += chunk))
      .on("end", () => resolve(data));
  });
}

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

function writeStream(chunkSize, filename, content) {
  return new Promise(resolve => {
    const stream = fs.createWriteStream(filename);
    const strStream = strToStream(content, chunkSize);
    strStream.pipe(stream);
    strStream.on("end", () => {
      stream.end();
      resolve();
    });
  });
}

function getOptsHash(opts) {
  return Object.keys(opts).reduce(
    (acc, key) => `${acc};${key}:${String(opts[key])}`,
    ""
  );
}

module.exports = { hash, fstat, mkdirp, readStream, writeStream, getOptsHash };
