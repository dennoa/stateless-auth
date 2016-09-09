'use strict';

const _ = require('lodash');

const defaultOptions = require('./options');

module.exports = options => {

  const passwordName = options.modelmap.credentials.password;
  const passwordHashName = options.modelmap.userInfo.passwordHash;

  function validCredentials(credentials, userInfo) {
    return (userInfo && userInfo[passwordHashName] === options.hashPassword(credentials[passwordName]));
  }

  return (credentials) => {
    return new Promise((resolve, reject) => {
      options.findUser(credentials).then(userInfo => {
        if (!validCredentials(credentials, userInfo)) { return reject(); }
        resolve(userInfo);
      }).catch(reject);
    });    
  };
  
};
