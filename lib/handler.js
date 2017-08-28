'use strict';

const request = require('request');
const _ = require('lodash');

module.exports = options => {

  const lookupTokenBaseParams = { url: options.tokenEndpoint, json: true, proxy: options.proxy };
  const lookupTokenMethod = (options.tokenEndpointRequiresFormPost) ? 'post' : 'get';
  const lookupTokenParamKey = (options.tokenEndpointRequiresFormPost) ? 'form' : 'qs';

  const lookupTokenParams = clientParams => Object.assign({
    [lookupTokenParamKey]: {
      code: clientParams.code,
      client_secret: options.clientSecret,
      client_id: clientParams.client_id || clientParams.clientId,
      redirect_uri: clientParams.redirect_uri || clientParams.redirectUri,
      grant_type: options.grantType || 'authorization_code'
    }
  }, lookupTokenBaseParams);

  const lookupToken = clientParams => new Promise((resolve, reject) => {
    request[lookupTokenMethod](lookupTokenParams(clientParams), (err, res, token) => {
      if (err) { return reject(err); }
      if (token.error) { return reject(token); }
      resolve(token);
    });
  });

  const retrieveUserInfoBaseParams = { url: options.userInfoEndpoint, headers: { 'User-Agent': 'Node' }, json: true, proxy: options.proxy };

  function retrieveUserInfoParams(token) {
    if (options.userInfoEndpointAuthorizationHeader) {
      return _.merge({ headers: { Authorization: `${options.userInfoEndpointAuthorizationHeader.trim()} ${token.access_token}` }}, retrieveUserInfoBaseParams);
    }
    return Object.assign({ qs: token }, retrieveUserInfoBaseParams);
  }

  const retrieveUserInfo = token => new Promise((resolve, reject) => {
    request.get(retrieveUserInfoParams(token), (err, res, userInfo) => {
      if (err) { return reject(err); }
      if (!userInfo) { return reject(); }
      if (userInfo.error) { return reject(userInfo); }
      resolve(userInfo);
    });
  });

  const auth = clientParams => lookupToken(clientParams).then(retrieveUserInfo);

  return auth;
};
