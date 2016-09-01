'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const supertest = require('supertest');
const expect = require('chai').expect;

const statelessAuth = require('../lib');
const hashPassword = require('../lib/login-handler/hash-password');

describe('default login handler', ()=> {

  let expectedError = { error: 'Expected for testing' };
  let statelessAuthInstance, userInfo;

  beforeEach(()=> {
    userInfo = { username: 'xyz', passwordHash: hashPassword('secret'), name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials, callback) => {
            callback(null, (credentials.username === userInfo.username) ? userInfo: null);
          }
        }
      }
    });
  });

  function sendAuthLoginRequest(data) {
    let app = express();
    app.use(bodyParser.json());
    app.use('/auth', statelessAuthInstance.routes);
    return supertest(app)
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send(data);
  }

  function verifyJWT(res) {
    let decoded = statelessAuthInstance.jwt.decode(res.body.token);
    expect(res.body.user_info.ids.login).to.equal(decoded.ids.login);
    expect(res.body.user_info.email).to.equal(decoded.email);
    expect(res.body.user_info.name).to.equal(decoded.name);
    expect(res.body.user_info.picture).to.equal(decoded.picture);
  }

  function verifyResponse(res) {
    expect(res.body.user_info.ids.login).to.equal(userInfo.username);
    expect(res.body.user_info.email).to.equal(userInfo.email);
    expect(res.body.user_info.name).to.equal(userInfo.name);
    expect(res.body.user_info.picture).to.equal(userInfo.picture);
    verifyJWT(res);
  }

  it('should login when the login-handler has been configured with an appropriate findUser function', (done)=> {
    sendAuthLoginRequest({ username: userInfo.username, password: 'secret' }).expect(200).end((err, res) => {
      verifyResponse(res);
      done();
    });
  });

  it('should return an error when the login-handler has not been configured with an appropriate findUser function', (done)=> {
    statelessAuthInstance = statelessAuth();
    sendAuthLoginRequest({ username: userInfo.username, password: 'secret' }).expect(500).end((err, res) => {
      expect(!!res.body.error).to.equal(true);
      done();
    });
  });

  it('should return an unauthorized response when the login credentials are invalid', (done)=> {
    sendAuthLoginRequest({ username: userInfo.username, password: 'incorrect' }).expect(401, done);
  });

  it('should allow standardiseUserInfo to be overridden to conform to the application model', (done)=> {
    userInfo = { id: 'xyz', passwordHash: hashPassword('secret'), name: { first: 'Bob', last: 'Brown' }, email: 'bob.brown@email.com', picture: 'http://my.picture.com' };
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials, callback) => {
            callback(null, (credentials.id === userInfo.id) ? userInfo: null);
          },
          standardiseUserInfo: null
        }
      }
    });
    sendAuthLoginRequest({ id: userInfo.id, password: 'secret' }).expect(200).end((err, res) => {
      expect(res.body.user_info).to.deep.equal(userInfo);
      done();
    });
  });

  it('should allow hashPassword to be overridden', (done)=> {
    let hashed = 'hashed';
    userInfo = { username: 'xyz', passwordHash: hashed, name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials, callback) => {
            callback(null, (credentials.username === userInfo.username) ? userInfo: null);
          },
          hashPassword: (clearPassword => hashed)
        }
      }
    });
    sendAuthLoginRequest({ username: userInfo.username, password: 'secret' }).expect(200).end((err, res) => {
      verifyResponse(res);
      done();
    });
  });

  it('should allow the password credential name to be overridden', (done)=> {
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials, callback) => {
            callback(null, (credentials.username === userInfo.username) ? userInfo: null);
          },
          modelmap: {
            credentials: {
              password: 'loginPassword'
            }
          }
        }
      }
    });
    sendAuthLoginRequest({ username: userInfo.username, loginPassword: 'secret' }).expect(200).end((err, res) => {
      verifyResponse(res);
      done();
    });
  });

  it('should allow the passwordHash user info model name to be overridden', (done)=> {
    userInfo = { username: 'xyz', hashedPassword: hashPassword('secret'), name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials, callback) => {
            callback(null, (credentials.username === userInfo.username) ? userInfo: null);
          },
          modelmap: {
            userInfo: {
              passwordHash: 'hashedPassword'
            }
          }
        }
      }
    });
    sendAuthLoginRequest({ username: userInfo.username, password: 'secret' }).expect(200).end((err, res) => {
      verifyResponse(res);
      done();
    });
  });

});