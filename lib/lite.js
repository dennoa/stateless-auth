'use strict';

const _ = require('lodash');
const getSecureMiddleware = require('./get-secure-middleware');
const getHeader = require('./get-header');
const mergeOptions = require('./merge-options');

function statelessAuth(options) {

  const opts = mergeOptions(_.pick(options, ['jwt', 'jwtCookie', 'secure']));
  const header = getHeader(opts);
  const secure = getSecureMiddleware(opts);

  return {
    options: opts,
    decodeAuthHeader: header.decode,
    secure,
  };
}

module.exports = statelessAuth;
