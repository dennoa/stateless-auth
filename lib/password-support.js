'use strict';

const bcrypt = require('bcryptjs');

module.exports = options => {

  const opts = options || {};

  const genSalt = () => new Promise((resolve, reject) =>
    bcrypt.genSalt(opts.rounds|| 10, (err, salt) => {
      return (err) ? reject(err): resolve(salt);
    }));
  
  const hashWithSalt = (password, salt) => new Promise((resolve, reject) =>
    bcrypt.hash(password, salt, (err, hash) => {
      return (err) ? reject(err) : resolve(hash);
    }));
  
  const hash = password => genSalt().then(salt => hashWithSalt(password, salt));
  
  return {
    hash,
    compare: bcrypt.compare,
  };
};
