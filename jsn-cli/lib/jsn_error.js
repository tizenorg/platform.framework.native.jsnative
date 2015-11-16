(function() {
  'use strict';

  module.exports = function JsnError(message) {
    Error.captureStackTrace(this, this.constructor.name);
    this.name = this.constructor.name;
    this.message = message;
  };

  require('util').inherits(module.exports, Error);
}());