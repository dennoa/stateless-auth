'use strict';

const request = require('request');
const _ = require('lodash');

module.exports = options => {

  const lookupTokenBaseParams = { url: options.tokenEndpoint, json: true, proxy: options.proxy };
  const lookupTokenMethod = (options.tokenEndpointRequiresFormPost) ? 'post' : 'get';
  const lookupTokenParamKey = (options.tokenEndpointRequiresFormPost) ? 'form' : 'qs';

  function lookupTokenParams(tokenParams) {
    let params = _.merge({}, lookupTokenBaseParams);
    params[lookupTokenParamKey] = tokenParams;
    return params;
  }

  function lookupToken(tokenParams) {
    return new Promise(function(resolve, reject) {
      request[lookupTokenMethod](lookupTokenParams(tokenParams), function(err, res, token) {
        if (err) { return reject(err); }
        if (token.error) { return reject(token); }
        resolve(token);
      });
    });
  }

  const retrieveUserInfoBaseParams = { url: options.userInfoEndpoint, json: true, proxy: options.proxy };

  function retrieveUserInfoParams(token) {
    if (options.userInfoEndpointAuthorizationHeader) {
      return _.merge({ headers: { Authorization: options.userInfoEndpointAuthorizationHeader.trim() + ' ' + token.access_token }}, retrieveUserInfoBaseParams);
    }
    return _.merge({ qs: token }, retrieveUserInfoBaseParams);
  }

  function retrieveUserInfo(token, cb) {
    request.get(retrieveUserInfoParams(token), function(err, res, userInfo) {
      if (err) { return cb(err); }
      if (userInfo.error) { return cb(userInfo); }
      cb(null, userInfo);
    });
  }

  function auth(tokenParams, cb) {
    lookupToken(tokenParams).then(function(token) {
      retrieveUserInfo(token, cb);
    }, cb);
  }

  return auth;
};
