module.exports = class CachefError extends Error {
  constructor(message, origMsg, stack) {
    super(message);
    this.message = `${message}: ${origMsg}`;
    this.stack = stack;
  }
};
