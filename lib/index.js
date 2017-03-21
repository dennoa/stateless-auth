'use strict';

const express = require('express');
const _ = require('lodash');

const defaultHandler = require('./handler');
const defaultOptions = require('./options');
const jwt = require('./jwt');
const swagger = require('./swagger');

function replaceArrays(target, source) {
  if (target instanceof Array) { 
    return source; 
  }
}

module.exports = options => {

  const router = express.Router();
  const opts = _.mergeWith({}, defaultOptions, options, replaceArrays);
  const jwtInstance = jwt(opts.jwt);
  const swaggerDocs = swagger(opts);
  const handlers = {};

  function toTokenParams(providerOpts, clientParams) {
    return _.merge({}, clientParams, {
      client_secret: providerOpts.clientSecret,
      client_id: clientParams.client_id || clientParams.clientId,
      redirect_uri: clientParams.redirect_uri || clientParams.redirectUri,
      grant_type: providerOpts.grantType || 'authorization_code'
    });
  }

  function parseAuthHeader(req) {
    let authHeader = req.get('Authorization') || '';
    let pos = authHeader.indexOf(' ');
    if (pos < 0) { return; }
    return {
      scheme: authHeader.substring(0, pos).toLowerCase(),
      param: authHeader.substring(pos + 1)
    };
  }

  function decodeBasicAuth(param, secureOptions) {
    if (!secureOptions || !secureOptions.basicAuth) { return; }
    try {
      let decoded = Buffer.from(param, 'base64').toString().split(':');
      let names = opts.providers.login.modelmap.credentials;
      let result = {};
      result[names.username] = decoded[0];
      result[names.password] = decoded[1];
      return result;
    } catch(e) {
      return;
    }
  }

  function decodeAuthHeaderWithScheme(req, secureOptions) {
    let authHeader = parseAuthHeader(req);
    if (!authHeader) { return {}; }
    let userInfo = (authHeader.scheme === 'basic') ? decodeBasicAuth(authHeader.param, secureOptions) : jwtInstance.decode(authHeader.param);
    return { scheme: authHeader.scheme, userInfo: userInfo };
  }

  const decodeAuthHeader = (req, secureOptions) => decodeAuthHeaderWithScheme(req, secureOptions).userInfo;
  const respondWithError = res => err => (err) ? res.status(500).send(err) : res.status(401).send();

  function handleUserInfo(secureOptions, res, userInfo) {
    if (secureOptions.reslocal) {
      res.locals[secureOptions.reslocal] = userInfo;
    }
  }

  function secure(secureOptions) {
    let secureOpts = _.merge({}, opts.secure, secureOptions);
    return (req, res, next) => {
      let decoded = decodeAuthHeaderWithScheme(req, secureOpts);
      if (!decoded.userInfo) { return res.status(401).send(); }
      if (decoded.scheme !== 'basic') {
        handleUserInfo(secureOpts, res, decoded.userInfo);
        return next();
      }
      handlers.login(decoded.userInfo).then(userInfo => {
        handleUserInfo(secureOpts, res, userInfo);
        next();
      }).catch(respondWithError(res));
    };
  }

  _.forEach(opts.providers, (providerOptions, provider) => {
    let handler = providerOptions.handler || defaultHandler;
    let standardiseUserInfo = providerOptions.standardiseUserInfo || (userInfo => userInfo);
    let providerOpts = _.merge({ proxy: opts.proxy }, _.omit(providerOptions, ['handler', 'standardiseUserInfo']));
    let handlerFn = handler(providerOpts);
    handlers[provider] = data => {
      let tokenParams = toTokenParams(providerOpts, data);
      return handlerFn(tokenParams).then(userInfo => standardiseUserInfo(userInfo));
    };

    router.post('/' + provider, (req, res) => {
      handlers[provider](req.body).then(userInfo => {
        let token = jwtInstance.encode(_.merge({}, decodeAuthHeader(req), userInfo));
        res.status(200).json({ token: token, user_info: userInfo }); 
      }).catch(respondWithError(res));
    });
  });

  router.get(opts.swagger.path, (req, res) => {
    res.status(200).json(swaggerDocs);
  });

  return {
    options: opts,
    decodeAuthHeader,
    jwt: jwtInstance,
    routes: router,
    secure,
    swagger: swaggerDocs
  };
};
