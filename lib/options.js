'use strict';

const defaultLoginHandler = require('./login-handler');

module.exports = {

  jwt: {
    secret: 'JWT_SECRET',
    expiresAfterSecs: 12*60*60
  },

  providers: {

    facebook: {
      tokenEndpoint: 'https://graph.facebook.com/v2.5/oauth/access_token',
      userInfoEndpoint: 'https://graph.facebook.com/v2.5/me?fields=id,email,first_name,last_name,link,name',
      clientSecret: 'CLIENT_SECRET',
      standardiseUserInfo: (userInfo)=> {
        return {
          ids: { facebook: userInfo.id },
          email: userInfo.email,
          name: userInfo.name,
          picture: 'https://graph.facebook.com/v2.5/' + userInfo.id + '/picture?type=large'
        };
      }
    },

    github: {
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
      userInfoEndpoint: 'https://api.github.com/user',
      clientSecret: 'CLIENT_SECRET',
      standardiseUserInfo: (userInfo)=> {
        return {
          ids: { github: userInfo.id },
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.avatar_url
        };
      },
      userInfoEndpointAuthorizationHeader: 'token'
    },

    google: {
      tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
      clientSecret: 'CLIENT_SECRET',      
      standardiseUserInfo: (userInfo)=> {
        return {
          ids: { google: userInfo.sub },
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        };
      },
      tokenEndpointRequiresFormPost: true,
      userInfoEndpointAuthorizationHeader: 'Bearer'
    },

    linkedin: {
      tokenEndpoint: 'https://www.linkedin.com/uas/oauth2/accessToken',
      userInfoEndpoint: 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)?format=json',
      clientSecret: 'CLIENT_SECRET',      
      standardiseUserInfo: (userInfo)=> {
        return {
          ids: { linkedin: userInfo.id },
          email: userInfo.emailAddress,
          name: userInfo.firstName + ' ' + userInfo.lastName,
          picture: userInfo.pictureUrl
        };
      },
      tokenEndpointRequiresFormPost: true,
      userInfoEndpointAuthorizationHeader: 'Bearer'
    },

    login: {
      handler: defaultLoginHandler,
      standardiseUserInfo: (userInfo)=> {
        return {
          ids: { login: userInfo.username },
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        };
      }
    }

  },

  proxy: null,

  secure: {
    reslocal: null
  }

};
