'use strict';

module.exports = options => {

  const usernameName = options.modelmap.credentials.username;
  const passwordName = options.modelmap.credentials.password;
  const passwordHashName = options.modelmap.userInfo.passwordHash;

  function toPromise(result) {
    return (result instanceof Promise) ? result : Promise.resolve(result);
  }

  function validateCredentials(credentials, userInfo) {
    if (!userInfo) { return Promise.reject(); }
    return toPromise(options.comparePassword(credentials[passwordName], userInfo[passwordHashName])).then(isValid => {
      return isValid ? Promise.resolve(userInfo) : Promise.reject();
    });
  }

  return credentials => {
    if (!credentials[usernameName] || !credentials[passwordName]) { return Promise.reject(); }
    return toPromise(options.findUser(credentials)).then(userInfo => validateCredentials(credentials, userInfo));
  };
  
};
