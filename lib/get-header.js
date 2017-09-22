'use strict';

const jwt = require('./jwt');

function getHeader(opts) {

  const jwtInstance = jwt(opts.jwt);

  function getCookie(req) {
    if (opts.jwtCookie.isEnabled) {
      const cookie = (req.cookies || {})[opts.jwtCookie.name];
      if (cookie) {
        return `bearer ${cookie}`;
      }
    }
  }

  function parseAuthHeader(req) {
    const authHeader = req.get('Authorization') || getCookie(req) || '';
    const pos = authHeader.indexOf(' ');
    return (pos < 0) ? undefined : {
      scheme: authHeader.substring(0, pos).toLowerCase(),
      param: authHeader.substring(pos + 1)
    };
  }

  function decodeBasicAuth(param, secureOptions) {
    if (!((secureOptions || {}).basicAuth || {}).isEnabled) { return; }
    try {
      return Buffer.from(param, 'base64').toString().split(':');
    } catch(e) {
      return;
    }
  }

  function decodeWithScheme(req, secureOptions) {
    const authHeader = parseAuthHeader(req);
    if (!authHeader) { return {}; }
    const userInfo = (authHeader.scheme === 'basic') ? decodeBasicAuth(authHeader.param, secureOptions) : jwtInstance.decode(authHeader.param);
    return { scheme: authHeader.scheme, userInfo };
  }

  const decode = (req, secureOptions) => decodeWithScheme(req, secureOptions).userInfo;

  return {
    decode,
    decodeWithScheme,
    jwt: jwtInstance,
  };
}

module.exports = getHeader;
