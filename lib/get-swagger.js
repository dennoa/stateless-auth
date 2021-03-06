'use strict';

const _ = require('lodash');
const getSwaggerDefinitions = require('./get-swagger-definitions');

module.exports = (opts, routeHandlers) => {

  const docOptions = opts.swagger.docs;
  const definitionsPrefix = (docOptions.basePath + opts.swagger.pathPrefix).replace(/\//g, '');

  function summaryText(provider, usesPassword) {
    if (usesPassword) {
      return `Username / password authentication via ${provider}`;
    }
    return `Authorisation code authentication with ${provider}`;
  }

  function descriptionText(provider, usesPassword) {
    if (usesPassword) {
      return `Provide your username and password credentials to authenticate via ${provider}`;
    }
    return `Use the code returned from the ${provider} authentication callback to finalise the authentication process`;
  }

  const definitionRef = name => `#/definitions/${definitionsPrefix}_${name}`;

  const parameter = usesPassword => ({
    name: usesPassword ? 'username_password' : 'authorization_code',
    in: 'body',
    schema: {
      $ref: definitionRef(usesPassword ? 'username_password' : 'authorization_code')
    }
  });

  function providerPath(providerOptions, provider) {
    const usesPassword = (providerOptions.grantType === 'password');
    const tag = ((docOptions.tags instanceof Array) && (docOptions.tags.length > 0)) ? docOptions.tags[0].name : 'authentication';
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

  const paths = {};
  Object.keys(routeHandlers).forEach(provider => {
    paths[`${opts.swagger.pathPrefix}/${provider}`] = providerPath(opts.providers[provider], provider);
  });

  const definitions = getSwaggerDefinitions(definitionsPrefix);

  return _.merge({ paths, definitions }, docOptions);
};
