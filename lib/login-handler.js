'use strict';

module.exports = options => {

  const usernameName = options.modelmap.credentials.username;
  const passwordName = options.modelmap.credentials.password;
  const passwordHashName = options.modelmap.userInfo.passwordHash;
  const comparePassword = options.passwordSupport.compare;

  function validateCredentials(credentials, userInfo) {
    if (!userInfo) { return Promise.reject(); }
    return Promise.resolve(comparePassword(credentials[passwordName], userInfo[passwordHashName])).then(isValid => {
      return isValid ? userInfo : Promise.reject();
    });
  }

  return credentials => {
    if (!credentials[usernameName] || !credentials[passwordName]) { return Promise.reject(); }
    return Promise.resolve(options.findUser(credentials)).then(userInfo => validateCredentials(credentials, userInfo));
  };
  
};
