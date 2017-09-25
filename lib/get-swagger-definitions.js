'use strict';

const stringProperty = text => ({ type: 'string', description: text });

module.exports = definitionsPrefix => {

  const definitions = {};
  
  definitions[`${definitionsPrefix}_authorization_code`] = {
    type: 'object',
    description: 'Authorization code request parameters',
    required: ['code','clientId','redirectUri'],
    properties: {
      code: stringProperty('The code returned from the provider authentication callback'),
      client_id: stringProperty('The public client id sent from the browser to the provider when authenticating'),
      redirect_uri: stringProperty('The redirect uri sent from the browser to the provider when authenticating')
    }
  };

  definitions[`${definitionsPrefix}_username_password`] = {
    type: 'object',
    description: 'Username and password request parameters',
    required: ['username','password'],
    properties: {
      username: stringProperty('Unique username'),
      password: stringProperty('Secret password')
    }
  };

  definitions[`${definitionsPrefix}_jwt_user`] = {
    type: 'object',
    description: 'JSON Web Token containing the core user details of the authenticated user, plus the user details',
    properties: {
      token: stringProperty('The Json Web Token (JWT)'),
      user_info: {
        type: 'object',
        description: 'User identifying information',
      }
    }
  };

  return definitions;
};
