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

  function toTokenParams(providerOpts, clientParams) {
    return _.merge({}, clientParams, {
      client_secret: providerOpts.clientSecret,
      client_id: clientParams.client_id || clientParams.clientId,
      redirect_uri: clientParams.redirect_uri || clientParams.redirectUri,
      grant_type: providerOpts.grantType || 'authorization_code'
    });
  }

  function decodeAuthHeader(req) {
    let authHeader = req.get('Authorization');
    return (authHeader && authHeader.length) ? jwtInstance.decode(authHeader.split(' ')[1]) : null;
  }

  function secure(secureOptions) {
    let secureOpts = _.merge({}, opts.secure, secureOptions);
    return (req, res, next) => {
      let userInfo = decodeAuthHeader(req);
      if (!userInfo) { return res.status(401).send(); }
      if (secureOpts.reslocal) { res.locals[secureOpts.reslocal] = userInfo; }
      next();
    };
  }

  _.forEach(opts.providers, (providerOptions, provider) => {
    let handler = providerOptions.handler || defaultHandler;
    let standardiseUserInfo = providerOptions.standardiseUserInfo || (userInfo => userInfo);
    let providerOpts = _.merge({ proxy: opts.proxy }, _.omit(providerOptions, ['handler', 'standardiseUserInfo']));
    let handlerFn = handler(providerOpts);

    router.post('/' + provider, (req, res) => {
      let tokenParams = toTokenParams(providerOpts, req.body);
      handlerFn(tokenParams).then(userInfo => {
        let standardUserInfo = standardiseUserInfo(userInfo);
        let token = jwtInstance.encode(_.merge({}, decodeAuthHeader(req), standardUserInfo));
        res.status(200).json({ token: token, user_info: standardUserInfo });
      }).catch(err => {
        if (!err) { return res.status(401).send(); }
        res.status(500).send(err);
      });
    });
  });

  router.get(opts.swagger.path, (req, res) => {
    res.status(200).json(swaggerDocs);
  });

  return {
    options: opts,
    decodeAuthHeader: decodeAuthHeader,
    jwt: jwtInstance,
    routes: router,
    secure: secure,
    swagger: swaggerDocs
  };
};
