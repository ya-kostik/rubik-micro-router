const STATUS_CODES = require('http').STATUS_CODES;

class RouterError extends Error {
  constructor(code, message) {
    const status = STATUS_CODES[code] || 'Unknown';
    super(message ? message : status);
    this.statusCode = code;
    this.status = status;
  }
}

module.exports = RouterError;
