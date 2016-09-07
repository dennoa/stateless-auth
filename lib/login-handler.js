'use strict';

const _ = require('lodash');

const defaultOptions = require('./options');

module.exports = options => {

  const passwordName = options.modelmap.credentials.password;
  const passwordHashName = options.modelmap.userInfo.passwordHash;

  function validCredentials(credentials, userInfo) {
    return (userInfo && userInfo[passwordHashName] === options.hashPassword(credentials[passwordName]));
  }

  return (credentials, cb) => {
    options.findUser(credentials, (err, userInfo) => {
      if (err) { return cb(err); }
      if (validCredentials(credentials, userInfo)) {
        return cb(err, userInfo);
      }
      cb(null, null);
    });
  };
  
};
