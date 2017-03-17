'use strict';

const crypto = require('crypto');

module.exports = clearPassword => {
  let hash = crypto.createHash('sha256');
  hash.update(clearPassword, 'utf8');
  return hash.digest('base64');
};
