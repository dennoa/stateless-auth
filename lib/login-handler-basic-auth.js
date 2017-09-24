'use strict';

const loginHandler = require('./login-handler');

module.exports = providerOpts => {

  const login = loginHandler(providerOpts);
  const credNames = providerOpts.modelMap.credentials;

  return creds => login({
    [credNames.username]: creds[0],
    [credNames.password]: creds[1],
  });
};
