'use strict';

const express = require('express');
const _ = require('lodash');
const getHandlers = require('./get-handlers');
const getSecureMiddleware = require('./get-secure-middleware');
const getHeader = require('./get-header');
const getSwagger = require('./get-swagger');
const mergeOptions = require('./merge-options');
const passwordSupport = require('./password-support');
const respond = require('./respond');

function statelessAuth(options) {

  const opts = mergeOptions(options);
  const handlers = getHandlers(opts);
  const header = getHeader(opts);
  const secure = getSecureMiddleware(opts);
  const swagger = getSwagger(opts);

  if (!opts.secure.basicAuth.loginHandler) {
    opts.secure.basicAuth.loginHandler = handlers.loginBasicAuth;
  }

  const routeHandlers = {};
  const routes = express.Router();

  Object.keys(handlers).forEach(provider => {  

    routeHandlers[provider] = (req, res) => handlers[provider](req.body, res).then(standardInfo => {
      const token = header.jwt.encode(_.merge({}, header.decode(req), standardInfo.authHeader));
      if (standardInfo.authCookie) {
        res.cookie(opts.jwtCookie.name, header.jwt.encode(standardInfo.authCookie));
      }
      res.status(200).json({ token, user_info: standardInfo.authHeader }); 
    }).catch(respond.withError(res));

    routes.post('/' + provider, routeHandlers[provider]);
  });

  routes.get(opts.swagger.path, (req, res) => {
    res.status(200).json(swagger);
  });

  return {
    options: opts,
    decodeAuthHeader: header.decode,
    jwt: header.jwt,
    passwordSupport,
    routes,
    routeHandlers,
    secure,
    swagger,
  };
}

statelessAuth.passwordSupport = passwordSupport;

module.exports = statelessAuth;
