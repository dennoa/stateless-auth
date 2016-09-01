'use strict';

const hashPassword = require('./hash-password');

module.exports = {

  findUser: (credentials, callback) => {
    callback({ error: 'An implemenation for findUser must be provided' });
  },

  hashPassword: hashPassword,

  modelmap: {
    credentials: {
      password: 'password'
    },
    userInfo: {
      passwordHash: 'passwordHash'
    }
  }
  
};
