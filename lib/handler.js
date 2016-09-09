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
    return new Promise((resolve, reject) => {
      request[lookupTokenMethod](lookupTokenParams(tokenParams), (err, res, token) => {
        if (err) { return reject(err); }
        if (token.error) { return reject(token); }
        resolve(token);
      });
    });
  }

  const retrieveUserInfoBaseParams = { url: options.userInfoEndpoint, headers: { 'User-Agent': 'Node' }, json: true, proxy: options.proxy };

  function retrieveUserInfoParams(token) {
    if (options.userInfoEndpointAuthorizationHeader) {
      return _.merge({ headers: { Authorization: options.userInfoEndpointAuthorizationHeader.trim() + ' ' + token.access_token }}, retrieveUserInfoBaseParams);
    }
    return _.merge({ qs: token }, retrieveUserInfoBaseParams);
  }

  function retrieveUserInfo(token) {
    return new Promise((resolve, reject) => {
      request.get(retrieveUserInfoParams(token), (err, res, userInfo) => {
        if (err) { return reject(err); }
        if (!userInfo) { return reject(); }
        if (userInfo.error) { return reject(userInfo); }
        resolve(userInfo);
      });
    });
  }

  function auth(tokenParams) {
    return new Promise((resolve, reject) => {
      lookupToken(tokenParams).then(token => {
        retrieveUserInfo(token).then(resolve, reject);
      }, reject);
    });
  }

  return auth;
};
