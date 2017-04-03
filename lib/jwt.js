'use strict';

const jwt = require('jwt-simple');

module.exports = options => {

  const defaultExpiry = () => ({ exp: Math.round(Date.now() / 1000) + options.expiresAfterSecs });

  const encode = data => jwt.encode(Object.assign(defaultExpiry(), data), options.secret);

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
