'use strict';

const expect = require('chai').expect;

const loginHandler = require('../../lib/login-handler');
const hashPassword = require('../../lib/login-handler/hash-password');

describe('login-handler', ()=> {

  let login, user;

  beforeEach(()=> {
    user = { username: 'bob', passwordHash: hashPassword('secret'), name: 'Bobby', email: 'bobby@home.com', picture: 'http://bobby.avatar.com' };
    login = loginHandler({
      findUser: (credentials, cb) => {
        cb(null, (credentials.username === user.username) ? user : null);
      }
    });
  });

  it('should use the provided lookup function to find user info', (done)=> {
    login({ username: 'bob', password: 'secret' }, (err, userInfo) => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

  it('should indicate authentication failure when the username is not valid', (done)=> {
    login({ username: 'cindy', password: 'secret' }, (err, userInfo) => {
      expect(!!userInfo).to.equal(false);
      done();
    });
  });

  it('should indicate authentication failure when the password is not valid', (done)=> {
    login({ username: 'bob', password: 'incorrect' }, (err, userInfo) => {
      expect(!!userInfo).to.equal(false);
      done();
    });
  });

  it('should callback with any errors found when finding the user', (done)=> {
    let expectedError = 'Expected for testing';
    login = loginHandler({
      findUser: (credentials, cb) => {
        cb(expectedError);
      }
    });
    login({ username: 'bob', password: 'secret' }, (err, userInfo) => {
      expect(err).to.equal(expectedError);
      done();
    });
  });

  it('should allow the username property on the credentials to be called something else', (done)=>{
    user.username = 'bob@work.com';
    login = loginHandler({
      findUser: (credentials, cb) => {
        cb(null, (credentials.loginEmail === user.username) ? user : null);
      }
    });
    login({ loginEmail: 'bob@work.com', password: 'secret' }, (err, userInfo) => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

  it('should allow the username property on the userInfo model to be called something else', (done)=>{
    login = loginHandler({
      findUser: (credentials, cb) => {
        cb(null, (credentials.username === user.email) ? user : null);
      }
    });
    login({ username: 'bobby@home.com', password: 'secret' }, (err, userInfo) => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

  it('should allow the passwordHash property on the userInfo model to be called something else', (done)=>{
    user = { name: 'Bobby', encodedPassword: hashPassword('secret'), email: 'bobby@home.com', picture: 'http://bobby.avatar.com' };
    login = loginHandler({
      modelmap: {
        userInfo: {
          passwordHash: 'encodedPassword'
        }
      },
      findUser: (credentials, cb) => {
        cb(null, (credentials.email === user.email) ? user : null);
      }
    });
    login({ email: 'bobby@home.com', password: 'secret' }, (err, userInfo) => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

  it('should allow the password property provided with the credentials to be called something else', (done)=>{
    login = loginHandler({
      modelmap: {
        credentials: {
          password: 'loginPassword'
        }
      },
      findUser: (credentials, cb) => {
        cb(null, (credentials.email === user.email) ? user : null);
      }
    });
    login({ email: 'bobby@home.com', loginPassword: 'secret' }, (err, userInfo) => {
      expect(userInfo).to.deep.equal(user);
      done();
    });
  });

});