'use strict';

const jwt = require('jwt-simple');
const _ = require('lodash');

module.exports = options => {

  function defaultExpiry() {
    return {
      exp: (Date.now() / 1000) + options.expiresAfterSecs
    };
  }

  function encode(data) {
    return jwt.encode(_.merge(defaultExpiry(), data), options.secret);
  }

  function decode(token) {
    try {
      return jwt.decode(token, options.secret);
    } catch(err) {
      return;
    }
  }

  return {
    encode,
    decode
  };
};
