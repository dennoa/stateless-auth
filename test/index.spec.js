'use strict';

const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');

const statelessAuth = require('../lib');

describe('stateless-auth', ()=> {

  let expectedError = { error: 'Expected for testing' };
  let stubGetRequest, stubPostRequest, statelessAuthInstance;

  beforeEach(()=> {
    statelessAuthInstance = statelessAuth();
    stubGetRequest = sinon.stub(request, 'get');
    stubPostRequest = sinon.stub(request, 'post');
  });

  afterEach(()=> {
    request.get.restore();
    request.post.restore();
  });

  function sendAuthRequest(provider, data) {
    let app = express();
    app.use(bodyParser.json());
    app.use('/auth', statelessAuthInstance.routes);
    return supertest(app)
      .post('/auth/' + provider)
      .set('Accept', 'application/json')
      .send(data);
  }

  it('should allow the default JWT secret key to be overridden', ()=> {
    let customOptions = {
      jwt: { secret: 'my own personal secret' }
    };
    statelessAuthInstance = statelessAuth(customOptions);
    expect(statelessAuthInstance.options.jwt.secret).to.equal(customOptions.jwt.secret);
  });

  it('should allow other authentication providers to be included', (done)=> {
    let userInfo = { ids: { myFavourite: 'xyz' }, name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
    let myHandlerConfig;
    let customOptions = {
      providers: {
        myFavourite: {
          configItNeeds: 'some stuff',
          handler: handlerConfig => {
            myHandlerConfig = handlerConfig;
            return (tokenParams, cb) => {
              cb(null, userInfo);
            };
          }
        }
      }
    };
    statelessAuthInstance = statelessAuth(customOptions);
    sendAuthRequest('myFavourite', {}).expect(200).end((err, res) => {
      expect(myHandlerConfig.configItNeeds).to.equal(customOptions.providers.myFavourite.configItNeeds);
      expect(res.body.user_info.ids.myFavourite).to.equal(userInfo.ids.myFavourite);
      expect(res.body.user_info.email).to.equal(userInfo.email);
      expect(res.body.user_info.name).to.equal(userInfo.name);
      expect(res.body.user_info.picture).to.equal(userInfo.picture);
      done();
    });
  });

  [ { name: 'facebook', qsOrForm: 'qs', userInfo: { id: '213', email: 'email@facebook', name: 'My name' } },
    { name: 'github', qsOrForm: 'qs', authHeader: 'token ', userInfo: { id: '321', email: 'email@github', name: 'Your name', avatar_url: 'https://my.avatar.com/me.jpg' } },
    { name: 'google', qsOrForm: 'form', authHeader: 'Bearer ', userInfo: { id: '987', email: 'email@google', name: 'Bob Jones', picture: 'https://my.pic.com/google.jpg' } },
    { name: 'linkedin', qsOrForm: 'form', userInfo: { id: '879', emailAddress: 'email@linkedin', firstName: 'Cindy', lastName: 'Mindy', pictureUrl: 'https://my.pic.com/me.jpg' } }
  ].forEach(provider => {

    describe('when handling ' + provider.name + ' authentication requests', ()=> {

      let onTokenRequest, onUserInfoRequest;

      beforeEach(()=> {
        if (provider.qsOrForm === 'qs') {
          onTokenRequest = stubGetRequest.onFirstCall();
          onUserInfoRequest = stubGetRequest.onSecondCall();
        } else {
          onTokenRequest = stubPostRequest.onFirstCall();
          onUserInfoRequest = stubGetRequest.onFirstCall();
        }
      });

      function getTokenRequestArgs() {
        return (provider.qsOrForm === 'qs') ? stubGetRequest.firstCall.args : stubPostRequest.firstCall.args;
      }

      function getUserInfoRequestArgs() {
        return (provider.qsOrForm === 'qs') ? stubGetRequest.secondCall.args : stubGetRequest.firstCall.args;
      }

      it('should use the token params to lookup the token from ' + provider.name, (done)=> {
        onTokenRequest.yields(expectedError);
        let tokenParams = { code: 'some code from ' + provider.name, client_id: 'some client id for ' + provider.name, redirect_uri: 'https://' + provider.name + '.redirect.uri.com' };
        sendAuthRequest(provider.name, tokenParams).expect(500, expectedError, ()=> {
          let reqParams = getTokenRequestArgs()[0];
          expect(reqParams.url).to.equal(statelessAuthInstance.options.providers[provider.name].tokenEndpoint);
          expect(reqParams[provider.qsOrForm].client_secret).to.equal(statelessAuthInstance.options.providers[provider.name].clientSecret);
          expect(reqParams[provider.qsOrForm].code).to.equal(tokenParams.code);
          expect(reqParams[provider.qsOrForm].client_id).to.equal(tokenParams.client_id);
          expect(reqParams[provider.qsOrForm].redirect_uri).to.equal(tokenParams.redirect_uri);
          expect(reqParams[provider.qsOrForm].grant_type).to.equal('authorization_code');
          expect(reqParams.json).to.equal(true);
          expect(reqParams.proxy).to.equal(statelessAuthInstance.options.proxy);
          done();
        });
      });

      it('should callback with any token errors from ' + provider.name, (done)=> {
        onTokenRequest.yields(null, null, expectedError);
        sendAuthRequest(provider.name, {}).expect(500, expectedError, done);
      });

      it('should use the ' + provider.name + ' token to lookup user information', (done)=> {
        let tokenResponse = { access_token: 'my ' + provider.name + ' token' };
        onTokenRequest.yields(null, null, tokenResponse);
        onUserInfoRequest.yields(expectedError);
        sendAuthRequest(provider.name, {}).expect(500, expectedError, ()=> {
          let reqParams = getUserInfoRequestArgs()[0];
          expect(reqParams.url).to.equal(statelessAuthInstance.options.providers[provider.name].userInfoEndpoint);
          if (provider.authHeader) {
            expect(reqParams.headers.Authorization).to.equal(provider.authHeader + tokenResponse.access_token);
          } else {
            expect(reqParams.qs.access_token).to.equal(tokenResponse.access_token);
          }
          expect(reqParams.json).to.equal(true);
          expect(reqParams.proxy).to.equal(statelessAuthInstance.options.proxy);
          done();
        });
      });

      it('should callback with any user info lookup errors from ' + provider.name, (done)=> {
        onTokenRequest.yields(null, null, { token: 'token' });
        onUserInfoRequest.yields(expectedError);
        sendAuthRequest(provider.name, {}).expect(500, expectedError, done);
      });

      it('should allow the default configuration for ' + provider.name + ' to be overridden', (done)=> {
        let customOptions = {
          jwt: { secret: 'my own personal secret' },
          proxy: 'http://my-proxy.com',
          providers: {}
        };
        customOptions.providers[provider.name] = { tokenEndpoint: 'my token endpoint', userInfoEndpoint: 'my user info endpoint', clientSecret: 'my secret' };
        statelessAuthInstance = statelessAuth(customOptions);
        expect(statelessAuthInstance.options.jwt.secret).to.equal(customOptions.jwt.secret);
        onTokenRequest.yields(null, null, { access_token: 'token' });
        onUserInfoRequest.yields(null, null, provider.userInfo);
        sendAuthRequest(provider.name, {}).expect(200, ()=> {
          let reqParams = getTokenRequestArgs()[0];
          expect(reqParams.url).to.equal(customOptions.providers[provider.name].tokenEndpoint);
          expect(reqParams[provider.qsOrForm].client_secret).to.equal(customOptions.providers[provider.name].clientSecret);
          expect(reqParams.proxy).to.equal(customOptions.proxy);
          reqParams = getUserInfoRequestArgs()[0];
          expect(reqParams.url).to.equal(customOptions.providers[provider.name].userInfoEndpoint);
          expect(reqParams.proxy).to.equal(customOptions.proxy);          
          done();
        });
      });

      it('should allow the default handler for ' + provider.name + ' to be overridden', (done)=> {
        let userInfo = { key: 1234, name: 'some name', email: 'some@email.com', picture: 'http://some.picture.com' };
        let myHandlerConfig;
        let myHandler = handlerConfig => {
          myHandlerConfig = handlerConfig;
          return (tokenParams, cb) => {
            cb(null, userInfo);
          };
        };
        let myStandardiseUserInfo = info => {
          info.ids = {};
          info.ids[provider.name] = info.key;
          return info;
        };
        let customOptions = { providers: {} };
        customOptions.providers[provider.name] = { customConfig: 'custom config for my handler', handler: myHandler, standardiseUserInfo: myStandardiseUserInfo };
        statelessAuthInstance = statelessAuth(customOptions);
        sendAuthRequest(provider.name, {}).expect(200).end((err, res) => {
          expect(myHandlerConfig.customConfig).to.equal(customOptions.providers[provider.name].customConfig);
          expect(res.body.user_info.ids[provider.name]).to.equal(userInfo.ids[provider.name]);
          expect(res.body.user_info.email).to.equal(userInfo.email);
          expect(res.body.user_info.name).to.equal(userInfo.name);
          expect(res.body.user_info.picture).to.equal(userInfo.picture);
          done();
        });
      });

      describe('when responding successfully from ' + provider.name, ()=> {

        beforeEach(()=> {
          onTokenRequest.yields(null, null, { access_token: 'token' });
          onUserInfoRequest.yields(null, null, provider.userInfo);
        });

        function verifyuserInfo(userInfo) {
          let expected = statelessAuthInstance.options.providers[provider.name].standardiseUserInfo(provider.userInfo);
          expect(userInfo.ids[provider.name]).to.equal(expected.ids[provider.name]);
          expect(userInfo.email).to.equal(expected.email);
          expect(userInfo.name).to.equal(expected.name);
          expect(userInfo.picture).to.equal(expected.picture);
        }

        it('should return user info from ' + provider.name + ' as a JWT', (done)=> {
          sendAuthRequest(provider.name, {}).expect(200).end((err, res) => {
            verifyuserInfo(statelessAuthInstance.jwt.decode(res.body.token));
            done();
          });
        });

        it('should return user info from ' + provider.name + ' in clear text', (done)=> {
          sendAuthRequest(provider.name, {}).expect(200).end((err, res) => {
            verifyuserInfo(res.body.user_info);
            done();
          });
        });
      });

    });

  });

});