'use strict';

const expect = require('chai').expect;

const loginHandler = require('../lib/login-handler');
const simpleHash = require('../lib/simple-hash');

describe('login-handler', ()=> {

  let login, user;

  beforeEach(()=> {
    user = { username: 'bob', passwordHash: simpleHash('secret'), name: 'Bobby', email: 'bobby@home.com', picture: 'http://bobby.avatar.com' };
    login = loginHandler({
      findUser: (credentials => new Promise((resolve, reject) => {
        if (credentials.username === user.username) { return resolve(user); }
        reject();
      })),
      hashPassword: simpleHash,
      modelmap: {
        credentials: { password: 'password' },
        userInfo: { passwordHash: 'passwordHash' }
      }
    });
  });

  it('should use the provided lookup function to find user info', (done)=> {
    login({ username: 'bob', password: 'secret' }).then(userInfo => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

  it('should indicate authentication failure when the username is not valid', (done)=> {
    login({ username: 'cindy', password: 'secret' }).catch(err => {
      done();
    });
  });

  it('should indicate authentication failure when the password is not valid', (done)=> {
    login({ username: 'bob', password: 'incorrect' }).catch(err => {
      done();
    });
  });

  it('should callback with any errors found when finding the user', (done)=> {
    let expectedError = 'Expected for testing';
    login = loginHandler({
      findUser: (credentials => new Promise((resolve,reject) => reject(expectedError))),
      hashPassword: simpleHash,
      modelmap: {
        credentials: { password: 'password' },
        userInfo: { passwordHash: 'passwordHash' }
      }
    });
    login({ username: 'bob', password: 'secret' }).catch(err => {
      expect(err).to.equal(expectedError);
      done();
    });
  });

  it('should allow the username property on the credentials to be called something else', (done)=>{
    user.username = 'bob@work.com';
    login = loginHandler({
      findUser: (credentials => new Promise((resolve, reject) => {
        if (credentials.loginEmail === user.username) { return resolve(user); }
        reject();
      })),
      hashPassword: simpleHash,
      modelmap: {
        credentials: { password: 'password' },
        userInfo: { passwordHash: 'passwordHash' }
      }
    });
    login({ loginEmail: 'bob@work.com', password: 'secret' }).then(userInfo => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

  it('should allow the username property on the userInfo model to be called something else', (done)=>{
    login = loginHandler({
      findUser: (credentials => new Promise((resolve, reject) => {
        if (credentials.username === user.email) { return resolve(user); }
        reject();
      })),
      hashPassword: simpleHash,
      modelmap: {
        credentials: { password: 'password' },
        userInfo: { passwordHash: 'passwordHash' }
      }
    });
    login({ username: 'bobby@home.com', password: 'secret' }).then(userInfo => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

  it('should allow the passwordHash property on the userInfo model to be called something else', (done)=>{
    user = { name: 'Bobby', encodedPassword: simpleHash('secret'), email: 'bobby@home.com', picture: 'http://bobby.avatar.com' };
    login = loginHandler({
      modelmap: {
        credentials: { password: 'password' },
        userInfo: { passwordHash: 'encodedPassword' }
      },
      findUser: (credentials => new Promise((resolve, reject) => {
        if (credentials.email === user.email) { return resolve(user); }
        reject();
      })),
      hashPassword: simpleHash
    });
    login({ email: 'bobby@home.com', password: 'secret' }).then(userInfo => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

  it('should allow the password property provided with the credentials to be called something else', (done)=>{
    login = loginHandler({
      modelmap: {
        credentials: { password: 'loginPassword' },
        userInfo: { passwordHash: 'passwordHash' }
      },
      findUser: (credentials => new Promise((resolve, reject) => {
        if (credentials.email === user.email) { return resolve(user); }
        reject();
      })),
      hashPassword: simpleHash
    });
    login({ email: 'bobby@home.com', loginPassword: 'secret' }).then(userInfo => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

});