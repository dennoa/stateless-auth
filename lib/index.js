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

  const routes = express.Router();
  const opts = _.mergeWith({}, defaultOptions, options, replaceArrays);
  const jwtInstance = jwt(opts.jwt);
  const swaggerDocs = swagger(opts);
  const handlers = {};

  function parseAuthHeader(req) {
    const authHeader = req.get('Authorization') || '';
    const pos = authHeader.indexOf(' ');
    if (pos < 0) { return; }
    return {
      scheme: authHeader.substring(0, pos).toLowerCase(),
      param: authHeader.substring(pos + 1)
    };
  }

  function decodeBasicAuth(param, secureOptions) {
    if (!secureOptions || !secureOptions.basicAuth) { return; }
    try {
      const decoded = Buffer.from(param, 'base64').toString().split(':');
      const names = opts.providers.login.modelmap.credentials;
      const result = {};
      result[names.username] = decoded[0];
      result[names.password] = decoded[1];
      return result;
    } catch(e) {
      return;
    }
  }

  function decodeAuthHeaderWithScheme(req, secureOptions) {
    const authHeader = parseAuthHeader(req);
    if (!authHeader) { return {}; }
    const userInfo = (authHeader.scheme === 'basic') ? decodeBasicAuth(authHeader.param, secureOptions) : jwtInstance.decode(authHeader.param);
    return { scheme: authHeader.scheme, userInfo };
  }

  const decodeAuthHeader = (req, secureOptions) => decodeAuthHeaderWithScheme(req, secureOptions).userInfo;
  const respondWithError = res => err => {
    return (err) ? res.status(500).send(err) : res.status(401).send();
  };

  function handleUserInfo(secureOptions, res, userInfo) {
    if (secureOptions.reslocal) {
      res.locals[secureOptions.reslocal] = userInfo;
    }
  }

  function secure(secureOptions) {
    const secureOpts = _.merge({}, opts.secure, secureOptions);
    return (req, res, next) => {
      const decoded = decodeAuthHeaderWithScheme(req, secureOpts);
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
    const handler = providerOptions.handler || defaultHandler;
    const standardiseUserInfo = providerOptions.standardiseUserInfo || (userInfo => userInfo);
    const providerOpts = _.merge({ proxy: opts.proxy }, _.omit(providerOptions, ['handler', 'standardiseUserInfo']));
    const handlerFn = handler(providerOpts);
    handlers[provider] = reqBody => handlerFn(reqBody).then(userInfo => standardiseUserInfo(userInfo, reqBody));

    routes.post('/' + provider, (req, res) => {
      handlers[provider](req.body).then(user_info => {
        const token = jwtInstance.encode(_.merge({}, decodeAuthHeader(req), user_info));
        res.status(200).json({ token, user_info }); 
      }).catch(respondWithError(res));
    });
  });

  routes.get(opts.swagger.path, (req, res) => {
    res.status(200).json(swaggerDocs);
  });

  return {
    options: opts,
    decodeAuthHeader,
    jwt: jwtInstance,
    routes,
    secure,
    swagger: swaggerDocs
  };
};
