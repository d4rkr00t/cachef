const crypto = require("crypto");
const fs = require("fs");
const promisify = require("util").promisify;

const mkdirp = promisify(require("mkdirp"));
const fstat = promisify(require("fs").stat);

function md5(string) {
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

module.exports = { md5, fstat, mkdirp, readStream };
