'use strict';

const _ = require('lodash');

const defaultOptions = require('./options');

module.exports = options => {

  const opts = _.merge({}, defaultOptions, options);
  const passwordName = opts.modelmap.credentials.password;
  const passwordHashName = opts.modelmap.userInfo.passwordHash;

  function validCredentials(credentials, userInfo) {
    return (userInfo && userInfo[passwordHashName] === opts.hashPassword(credentials[passwordName]));
  }

  return (credentials, cb) => {
    opts.findUser(credentials, (err, userInfo) => {
      if (err) { return cb(err); }
      if (validCredentials(credentials, userInfo)) {
        return cb(err, userInfo);
      }
      cb(null, null);
    });
  };
  
};
