'use strict';

module.exports = options => {

  const usernameName = options.modelmap.credentials.username;
  const passwordName = options.modelmap.credentials.password;
  const passwordHashName = options.modelmap.userInfo.passwordHash;

  const validCredentials = (credentials, userInfo) =>
    (userInfo && userInfo[passwordHashName] === options.hashPassword(credentials[passwordName]));

  return credentials => new Promise((resolve, reject) => {
    if (!credentials[usernameName] || !credentials[passwordName]) { return reject(); }
    options.findUser(credentials).then(userInfo => {
      return validCredentials(credentials, userInfo) ? resolve(userInfo) : reject();
    }).catch(reject);
  });    
  
};
