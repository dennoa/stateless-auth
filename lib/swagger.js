'use strict';

const _ = require('lodash');
const swaggerDefinitions = require('./swagger-definitions');

module.exports = options => {

  let docOptions = options.swagger.docs;
  let definitionsPrefix = (docOptions.basePath + options.swagger.pathPrefix).replace(/\//g, '');

  function summaryText(provider, usesPassword) {
    if (usesPassword) {
      return 'Username / password authentication via ' + provider;
    }
    return 'Authorisation code authentication with ' + provider;
  }

  function descriptionText(provider, usesPassword) {
    if (usesPassword) {
      return 'Provide your username and password credentials to authenticate via ' + provider;
    }
    return 'Use the code returned from the ' + provider + ' authentication callback to finalise the authentication process';
  }

  function definitionRef(name) {
    return '#/definitions/' + definitionsPrefix + '_' + name;
  }

  function parameter(usesPassword) {
    return {
      name: usesPassword ? 'username_password' : 'authorization_code',
      in: 'body',
      schema: {
        $ref: definitionRef(usesPassword ? 'username_password' : 'authorization_code')
      }
    };
  }

  function providerPath(providerOptions, provider) {
    let usesPassword = (providerOptions.grantType === 'password');
    let tag = ((docOptions.tags instanceof Array) && (docOptions.tags.length > 0)) ? docOptions.tags[0].name : 'authentication';
    return {
      post: {
        tags: [tag],
        summary: summaryText(provider, usesPassword),
        description: descriptionText(provider, usesPassword),
        parameters: [parameter(usesPassword)],
        responses: {
          '200': {
            description: 'JWT and user info',
            schema: {
              $ref: definitionRef('jwt_user')
            }
          }
        }
      }
    };
  }

  let paths = {};
  _.forEach(options.providers, (providerOptions, provider) => {
    paths[options.swagger.pathPrefix + '/' + provider] = providerPath(providerOptions, provider);
  });

  let definitions = swaggerDefinitions(definitionsPrefix);

  return _.merge({ paths: paths, definitions: definitions }, docOptions);

};