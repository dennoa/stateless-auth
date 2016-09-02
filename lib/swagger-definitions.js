'use strict';

function stringProperty(text) {
  return { type: 'string', description: text };
}

module.exports = basePath => {

  let prefix = (basePath || '/auth').substring(1); 
  let definitions = {};
  
  definitions[prefix + '_authorization_code'] = {
    type: 'object',
    description: 'Authorization code request parameters',
    required: ['code','clientId','redirectUri'],
    properties: {
      code: stringProperty('The code returned from the provider authentication callback'),
      client_id: stringProperty('The public client id sent from the browser to the provider when authenticating'),
      redirect_uri: stringProperty('The redirect uri sent from the browser to the provider when authenticating')
    }
  };

  definitions[prefix + '_username_password'] = {
    type: 'object',
    description: 'Username and password request parameters',
    required: ['username','password'],
    properties: {
      username: stringProperty('Unique username'),
      password: stringProperty('Secret password')
    }
  };

  definitions[prefix + '_jwt_user'] = {
    type: 'object',
    description: 'JSON Web Token containing the core user details of the authenticated user, plus the user details',
    properties: {
      token: stringProperty('The Json Web Token (JWT)'),
      user_info: {
        type: 'object',
        description: 'Basic user information',
        properties: {
          ids: {
            type: 'object',
            description: 'Unique identifiers for this user',
            properties: {
              provider: stringProperty('The property name identifies the provider (facebook, google, login, etc.). The value is the unique id for that provider')
            }
          },
          name: stringProperty('Full name'),
          email: stringProperty('Email address'),
          picture: stringProperty('Url to picture')
        }
      }
    }
  };

  return definitions;
};
