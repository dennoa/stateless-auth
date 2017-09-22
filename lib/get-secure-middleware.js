'use strict';

const _ = require('lodash');
const getHeader = require('./get-header');
const respond = require('./respond');

function getSecureMiddleware(opts) {

  const header = getHeader(opts);

  function handleUserInfo(secureOptions, res, userInfo) {
    if (secureOptions.reslocal) {
      res.locals[secureOptions.reslocal] = userInfo;
    }
  }

  function getBasicAuthHandler(secureOpts) {
    const basicAuthLoginHandler = secureOpts.basicAuth.loginHandler;
    return (decoded, res, next) => {
      if (typeof basicAuthLoginHandler !== 'function') {
        return respond.withError(res)('Must provide a basic auth login handler function');
      }
      return Promise.resolve(basicAuthLoginHandler(decoded.userInfo)).then(standardInfo => {
        handleUserInfo(secureOpts, res, standardInfo.authHeader || standardInfo);
        next();
      }).catch(respond.withError(res));
    };
  }

  function secure(secureOptions) {
    const secureOpts = _.merge({}, opts.secure, secureOptions);
    const basicAuthHandler = getBasicAuthHandler(secureOpts);
    return (req, res, next) => {
      const decoded = header.decodeWithScheme(req, secureOpts);
      if (!decoded.userInfo) { return respond.withUnauthorised(res); }
      if (decoded.scheme === 'basic') { return basicAuthHandler(decoded, res, next); }
      handleUserInfo(secureOpts, res, decoded.userInfo);
      return next();
    };
  }

  return secure;
}

module.exports = getSecureMiddleware;
