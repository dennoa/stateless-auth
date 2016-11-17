'use strict';

module.exports = options => {

  const usernameName = options.modelmap.credentials.username;
  const passwordName = options.modelmap.credentials.password;
  const passwordHashName = options.modelmap.userInfo.passwordHash;

  function validCredentials(credentials, userInfo) {
    return (userInfo && userInfo[passwordHashName] === options.hashPassword(credentials[passwordName]));
  }

  return (credentials) => {
    return new Promise((resolve, reject) => {
      if (!credentials[usernameName] || !credentials[passwordName]) { return reject(); }
      options.findUser(credentials).then(userInfo => {
        if (!validCredentials(credentials, userInfo)) { return reject(); }
        resolve(userInfo);
      }).catch(reject);
    });    
  };
  
};
