'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const supertest = require('supertest');
const expect = require('chai').expect;

const statelessAuth = require('../lib');

describe('default login handler', ()=> {

  const expectedError = { error: 'Expected for testing' };
  let statelessAuthInstance, userInfo, passwordSupport;

  beforeEach(done => {
    passwordSupport = statelessAuth.passwordSupport({ rounds: 1 });
    passwordSupport.hash('secret').then(passwordHash => {
      userInfo = { username: 'xyz', passwordHash, name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
      statelessAuthInstance = statelessAuth({
        providers: {
          login: {
            findUser: (credentials => new Promise((resolve, reject) => {
              if (credentials.username === userInfo.username) {
                return resolve(userInfo);
              }
              reject();
            })),
            passwordSupport,
          }
        }
      });
      done();
    });
  });

  function sendAuthLoginRequest(data) {
    const app = express();
    app.use(bodyParser.json());
    app.use('/auth', statelessAuthInstance.routes);
    return supertest(app)
      .post('/auth/login')
      .set('Accept', 'application/json')
      .send(data);
  }

  function verifyJWT(res) {
    const decoded = statelessAuthInstance.jwt.decode(res.body.token);
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

  it('should login when the login-handler has been configured with an appropriate findUser function', done => {
    sendAuthLoginRequest({ username: userInfo.username, password: 'secret' }).end((err, res) => {
      expect(res.statusCode).to.equal(200);
      verifyResponse(res);
      done();
    });
  });

  it('should return an error when the login-handler has not been configured with an appropriate findUser function', done => {
    statelessAuthInstance = statelessAuth();
    sendAuthLoginRequest({ username: userInfo.username, password: 'secret' }).end((err, res) => {
      expect(res.statusCode).to.equal(500);
      expect(res.body.error).to.equal('An implementation for findUser must be provided');
      done();
    });
  });

  it('should return an unauthorized response when the login credentials are invalid', done => {
    sendAuthLoginRequest({ username: userInfo.username, password: 'incorrect' }).end((err, res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.body[0]).to.deep.equal({ param: 'credentials', msg: 'unauthorised' });
      done();
    });
  });

  it('should return an unauthorized response when the login username is not provided', done => {
    sendAuthLoginRequest({ password: 'incorrect' }).end((err, res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.body[0]).to.deep.equal({ param: 'credentials', msg: 'unauthorised' });
      done();
    });
  });

  it('should return an unauthorized response when the login password is not provided', done => {
    sendAuthLoginRequest({ username: userInfo.username }).end((err, res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.body[0]).to.deep.equal({ param: 'credentials', msg: 'unauthorised' });
      done();
    });
  });

  it('should allow standardiseUserInfo to be overridden to conform to the application model', done => {
    passwordSupport.hash('secret').then(passwordHash => {
      userInfo = { id: 'xyz', passwordHash, name: { first: 'Bob', last: 'Brown' }, email: 'bob.brown@email.com', picture: 'http://my.picture.com' };
      statelessAuthInstance = statelessAuth({
        providers: {
          login: {
            findUser: (credentials => new Promise((resolve, reject) => {
              if (credentials.id === userInfo.id) {
                return resolve(userInfo);
              }
              reject();
            })),
            passwordSupport,
            standardiseUserInfo: null,
            modelMap: {
              credentials: {
                username: 'id'
              }
            }
          }
        }
      });
      sendAuthLoginRequest({ id: userInfo.id, password: 'secret' }).expect(200).end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.user_info).to.deep.equal(userInfo);
        done();
      });
    });
  });

  it('should allow passwordSupport to be overridden', done => {
    const hashed = 'hashed';
    userInfo = { username: 'xyz', passwordHash: hashed, name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials => new Promise((resolve, reject) => {
            if (credentials.username === userInfo.username) {
              return resolve(userInfo);
            }
            reject();
          })),
          passwordSupport: { compare: (password, hash) => Promise.resolve(hash === hashed) }
        }
      }
    });
    sendAuthLoginRequest({ username: userInfo.username, password: 'secret' }).expect(200).end((err, res) => {
      verifyResponse(res);
      done();
    });
  });

  it('should allow passwordSupport to be overridden with a different configuration of the default implementation', done => {
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials => new Promise((resolve, reject) => {
            if (credentials.username === userInfo.username) {
              return resolve(userInfo);
            }
            reject();
          })),
          passwordSupport: statelessAuth.passwordSupport({ rounds: 2 })
        }
      }
    });
    statelessAuthInstance.options.providers.login.passwordSupport.hash('secret').then(passwordHash => {
      userInfo = { username: 'xyz', passwordHash, name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
      sendAuthLoginRequest({ username: userInfo.username, password: 'secret' }).expect(200).end((err, res) => {
        verifyResponse(res);
        done();
      });
    });
  });

  it('should return an unauthorized response when the overridden passwordSupport.compare function returns false', done => {
    userInfo = { username: 'xyz', passwordHash: 'hashed', name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials => new Promise((resolve, reject) => {
            if (credentials.username === userInfo.username) {
              return resolve(userInfo);
            }
            reject();
          })),
          passwordSupport: { compare: (password, hash) => Promise.resolve(false) }
        }
      }
    });
    sendAuthLoginRequest({ username: userInfo.username, password: 'incorrect' }).end((err, res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.body[0]).to.deep.equal({ param: 'credentials', msg: 'unauthorised' });
      done();
    });
  });

  it('should allow the password credential name to be overridden', done => {
    statelessAuthInstance = statelessAuth({
      providers: {
        login: {
          findUser: (credentials => new Promise((resolve, reject) => {
            if (credentials.username === userInfo.username) {
              return resolve(userInfo);
            }
            reject();
          })),
          passwordSupport,
          modelMap: {
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

  it('should allow the passwordHash user info model name to be overridden', done => {
    passwordSupport.hash('secret').then(hashedPassword => {
      userInfo = { username: 'xyz', hashedPassword, name: 'some body', email: 'my@email.com', picture: 'http://my.picture.com' };
      statelessAuthInstance = statelessAuth({
        providers: {
          login: {
            findUser: (credentials => new Promise((resolve, reject) => {
              if (credentials.username === userInfo.username) {
                return resolve(userInfo);
              }
              reject();
            })),
            passwordSupport,
            modelMap: {
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

});