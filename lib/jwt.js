'use strict';

const jwt = require('jwt-simple');

module.exports = options => {

  function getExpiresAfterSecs() {
    return (typeof options.expiresAfterSecs === 'function') ? options.expiresAfterSecs() : options.expiresAfterSecs;
  } 

  const defaultExpiry = () => ({ exp: Math.round(Date.now() / 1000) + getExpiresAfterSecs() });

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
