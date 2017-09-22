'use strict';

const loginHandler = require('./login-handler');
const loginHandlerBasicAuth = require('./login-handler-basic-auth');
const passwordSupport = require('./password-support');

const login = {
  handler: loginHandler,
  standardiseUserInfo: userInfo => ({
    ids: { login: userInfo.username },
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture
  }),
  standardiseUserInfoForCookie: null,
  grantType: 'password',
  findUser: () => Promise.reject(new Error('An implementation for findUser must be provided')),
  passwordSupport: passwordSupport({ rounds: 10 }),
  modelMap: {
    credentials: { username: 'username', password: 'password' },
    userInfo: { passwordHash: 'passwordHash' }
  }
};

const loginBasicAuth = Object.assign({}, login, {
  handler: loginHandlerBasicAuth,
});

const facebook = {
  tokenEndpoint: 'https://graph.facebook.com/v2.5/oauth/access_token',
  userInfoEndpoint: 'https://graph.facebook.com/v2.5/me?fields=id,email,first_name,last_name,link,name,age_range,picture,gender,cover,locale,timezone',
  clientSecret: 'CLIENT_SECRET',
  standardiseUserInfo: userInfo => ({
    ids: { facebook: userInfo.id },
    email: userInfo.email,
    name: userInfo.name,
    picture: `https://graph.facebook.com/v2.5/${userInfo.id}/picture?type=large`
  }),
  standardiseUserInfoForCookie: null,
};

const github = {
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  userInfoEndpoint: 'https://api.github.com/user',
  clientSecret: 'CLIENT_SECRET',
  standardiseUserInfo: userInfo => ({
    ids: { github: userInfo.id },
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.avatar_url
  }),
  standardiseUserInfoForCookie: null,
  userInfoEndpointAuthorizationHeader: 'token'
};

const google = {
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
  clientSecret: 'CLIENT_SECRET',      
  standardiseUserInfo: userInfo => ({
    ids: { google: userInfo.sub },
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture
  }),
  standardiseUserInfoForCookie: null,
  tokenEndpointRequiresFormPost: true,
  userInfoEndpointAuthorizationHeader: 'Bearer'
};

const linkedin = {
  tokenEndpoint: 'https://www.linkedin.com/uas/oauth2/accessToken',
  userInfoEndpoint: 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)?format=json',
  clientSecret: 'CLIENT_SECRET',      
  standardiseUserInfo: userInfo => ({
    ids: { linkedin: userInfo.id },
    email: userInfo.emailAddress,
    name: userInfo.firstName + ' ' + userInfo.lastName,
    picture: userInfo.pictureUrl
  }),
  standardiseUserInfoForCookie: null,
  tokenEndpointRequiresFormPost: true,
  userInfoEndpointAuthorizationHeader: 'Bearer'
};

const swagger = {
  path: '/swagger',
  pathPrefix: '',
  docs: {
    swagger: '2.0',
    info: {
      title: 'Authentication API',
      description: 'Authentication API',
      version: '1.0'
    },
    basePath: '/auth',
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'authentication', description: 'authentication' }
    ]
  }
};

module.exports = {
  
  jwt: {
    secret: 'JWT_SECRET',
    expiresAfterSecs: 12*60*60,
  },

  jwtCookie: {
    isEnabled: false,
    name: 'jwt',
  },

  providers: { facebook, github, google, linkedin, login, loginBasicAuth },

  proxy: null,

  secure: {
    reslocal: null,
    basicAuth: { isEnabled: false, loginHandler: null },
  },

  swagger,
};
