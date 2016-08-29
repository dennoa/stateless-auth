'use strict';

const express = require('express');
const _ = require('lodash');

const defaultHandler = require('./handler');
const defaultOptions = require('./options');
const jwt = require('./jwt');

module.exports = options => {

  const router = express.Router();
  const opts = _.merge({}, defaultOptions, options);
  const jwtInstance = jwt(opts.jwt);

  function toTokenParams(clientSecret, clientParams) {
    return {
      client_secret: clientSecret,
      code: clientParams.code,
      client_id: clientParams.clientId || clientParams.client_id,
      redirect_uri: clientParams.redirectUri || clientParams.redirect_uri,
      grant_type: 'authorization_code'
    };
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
      let tokenParams = toTokenParams(providerOpts.clientSecret, req.body);
      handlerFn(tokenParams, (err, userInfo) => {
        if (err) { return res.status(500).send(err); }
        let standardUserInfo = standardiseUserInfo(userInfo);
        let token = jwtInstance.encode(_.merge({}, decodeAuthHeader(req), standardUserInfo));
        res.status(200).json({ token: token, user_info: standardUserInfo });
      });

    });
  });

  return {
    options: opts,
    decodeAuthHeader: decodeAuthHeader,
    jwt: jwtInstance,
    routes: router,
    secure: secure
  };
};
