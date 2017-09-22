'use strict';

const loginHandler = require('./login-handler');

module.exports = providerOpts => {

  const login = loginHandler(providerOpts);
  const usernameName = providerOpts.modelMap.credentials.username;
  const passwordName = providerOpts.modelMap.credentials.password;

  return creds => login({
    [usernameName]: creds[0],
    [passwordName]: creds[1],
  });
};
