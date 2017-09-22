'use strict';

const jwt = require('jwt-simple');

module.exports = jwtOpts => {

  function getExpiresAfterSecs() {
    return (typeof jwtOpts.expiresAfterSecs === 'function') ? jwtOpts.expiresAfterSecs() : jwtOpts.expiresAfterSecs;
  } 

  const defaultExpiry = () => ({ exp: Math.round(Date.now() / 1000) + getExpiresAfterSecs() });

  const encode = data => jwt.encode(Object.assign(defaultExpiry(), data), jwtOpts.secret);

  function decode(token) {
    try {
      return jwt.decode(token, jwtOpts.secret);
    } catch(err) {
      return;
    }
  }

  return {
    encode,
    decode
  };
};
