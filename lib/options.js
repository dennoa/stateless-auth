'use strict';

const loginHandler = require('./login-handler');
const simpleHash = require('./simple-hash');

module.exports = {
  
  jwt: {
    secret: 'JWT_SECRET',
    expiresAfterSecs: 12*60*60
  },

  jwtCookie: {
    isEnabled: false,
    name: 'jwt'
  },

  providers: {

    facebook: {
      tokenEndpoint: 'https://graph.facebook.com/v2.5/oauth/access_token',
      userInfoEndpoint: 'https://graph.facebook.com/v2.5/me?fields=id,email,first_name,last_name,link,name',
      clientSecret: 'CLIENT_SECRET',
      standardiseUserInfo: userInfo => ({
        ids: { facebook: userInfo.id },
        email: userInfo.email,
        name: userInfo.name,
        picture: `https://graph.facebook.com/v2.5/${userInfo.id}/picture?type=large`
      }),
      standardiseUserInfoForCookie: null,
    },

    github: {
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
    },

    google: {
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
    },

    linkedin: {
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
    },

    login: {
      handler: loginHandler,
      standardiseUserInfo: userInfo => ({
        ids: { login: userInfo.username },
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }),
      standardiseUserInfoForCookie: null,
      grantType: 'password',
      findUser: () => Promise.reject({ error: 'An implementation for findUser must be provided' }),
      hashPassword: simpleHash,
      comparePassword: (password, passwordHash) => Promise.resolve(simpleHash(password) === passwordHash),
      modelmap: {
        credentials: { username: 'username', password: 'password' },
        userInfo: { passwordHash: 'passwordHash' }
      }
    }

  },

  proxy: null,

  secure: {
    reslocal: null,
    basicAuth: false
  },

  swagger: {
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
  }

};
