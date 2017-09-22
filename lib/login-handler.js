'use strict';

module.exports = providerOpts => {

  const credNames = providerOpts.modelMap.credentials;
  const userNames = providerOpts.modelMap.userInfo;
  const passwordSupport = providerOpts.passwordSupport;

  function validateCredentials(credentials, userInfo) {
    if (!userInfo) { return Promise.reject(); }
    return Promise.resolve(passwordSupport.compare(credentials[credNames.password], userInfo[userNames.passwordHash])).then(isValid => {
      return isValid ? userInfo : Promise.reject();
    });
  }

  return credentials => {
    if (!credentials[credNames.username] || !credentials[credNames.password]) { return Promise.reject(); }
    return Promise.resolve(providerOpts.findUser(credentials)).then(userInfo => validateCredentials(credentials, userInfo));
  };
  
};
