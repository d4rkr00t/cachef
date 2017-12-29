const crypto = require("crypto");
const promisify = require("util").promisify;

const mkdirp = promisify(require("mkdirp"));
const fstat = promisify(require("fs").stat);

function md5(string) {
  return crypto
    .createHash("md5")
    .update(string)
    .digest("hex");
}

module.exports = { md5, fstat, mkdirp };
