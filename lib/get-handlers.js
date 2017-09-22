'use strict';

const _ = require('lodash');

const defaultHandler = require('./handler');

const getHandlers = opts => Object.keys(opts.providers).reduce((handlers, provider) => {

  const providerOptions = opts.providers[provider];
  const handler = providerOptions.handler || defaultHandler;
  const standardiseUserInfo = providerOptions.standardiseUserInfo || (userInfo => userInfo);
  const standardiseUserInfoForCookie = providerOptions.standardiseUserInfoForCookie || standardiseUserInfo;
  const providerOpts = _.merge({ proxy: opts.proxy }, _.omit(providerOptions, ['handler', 'standardiseUserInfo', 'standardiseUserInfoForCookie']));
  const handlerFn = handler(providerOpts);

  return Object.assign(handlers, {
    [provider]: (reqBody, res) => handlerFn(reqBody).then(userInfo =>
      Promise.resolve(standardiseUserInfo(userInfo, reqBody, res)).then(authHeader => {
        if (!opts.jwtCookie.isEnabled) { return { authHeader }; }
        if (standardiseUserInfoForCookie === standardiseUserInfo) { return { authHeader, authCookie: authHeader }; }
        return Promise.resolve(standardiseUserInfoForCookie(userInfo, reqBody, res)).then(authCookie => ({ authHeader, authCookie }));
      }))
  });
}, {});

module.exports = getHandlers;
