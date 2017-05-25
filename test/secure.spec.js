'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');

const statelessAuth = require('../lib');

describe('secure routes', ()=> {

  let statelessAuthInstance;

  beforeEach(()=> {
    statelessAuthInstance = statelessAuth();
  });

  function sendRequestToBeVerified(path, token, scheme='Bearer') {
    const app = express();
    app.use(bodyParser.json());
    app.use(path, statelessAuthInstance.secure(), (req, res)=> { res.status(200).json({ success: true }); });
    const req = supertest(app)
      .post(path)
      .set('Accept', 'application/json');
    if (token) {
      req.set('Authorization', scheme + ' ' + token);
    }
    return req.send();
  }

  it('should deny access to secure paths where no authentication header has been provided', done => {
    sendRequestToBeVerified('/secure').expect(401, done);
  });

  it('should deny access to secure paths where an invalid authentication header has been provided', done => {
    let differentSecret = { jwt: { secret: 'some other secret' } };
    let invalidToken = statelessAuth(differentSecret).jwt.encode({ userId: 'user_id', name: 'Bob' });
    sendRequestToBeVerified('/secure', invalidToken).expect(401, done);
  });

  it('should allow access to secure paths where a valid authentication header has been provided', done => {
    let token = statelessAuthInstance.jwt.encode({ userId: 'user_id', name: 'Bob' });
    sendRequestToBeVerified('/secure', token).expect(200, done);
  });

  it('should deny basic-auth access to secure paths where basic-auth is not permitted (default setting)', done => {
    let token = new Buffer('bob:secret').toString('base64');
    sendRequestToBeVerified('/secure', token, 'Basic').expect(401, done);
  });

  it('should allow basic-auth access to secure paths where basic-auth is permitted', done => {
    statelessAuthInstance = statelessAuth({ secure: { basicAuth: true }, providers: { login: {
      findUser: () => {
        return Promise.resolve({ name: 'Bob', passwordHash: 'secret' });
      },
      comparePassword: (password, hash) => Promise.resolve(hash === password)
    }}});
    let token = new Buffer('bob:secret').toString('base64');
    sendRequestToBeVerified('/secure', token, 'Basic').expect(200, done);
  });

  it('should place user login details on res.local for basic-auth access when specified in global options', done => {
    statelessAuthInstance = statelessAuth({ secure: { basicAuth: true, reslocal: 'basicUserInfo' }, providers: { login: {
      findUser: () => {
        return Promise.resolve({ name: 'Bob', passwordHash: 'secret' });
      },
      comparePassword: (password, hash) => Promise.resolve(hash === password)
    }}});
    let token = new Buffer('bob:secret').toString('base64');
    let app = express();
    app.use(bodyParser.json());
    app.use('/secure-basic', statelessAuthInstance.secure(), (req, res)=> { 
      expect(res.locals.basicUserInfo.name).to.equal('Bob');
      res.status(200).json({ success: true }); 
    });
    supertest(app).post('/secure-basic').set('Accept', 'application/json').set('Authorization', 'Basic ' + token).send().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      done();
    });
  });

  it('should place valid user info on res.local when specified in the global options', done => {
    statelessAuthInstance = statelessAuth({ secure: { reslocal: 'userInfo' }});
    let userInfo = { userId: 'user_id', name: 'Bob' };
    let token = statelessAuthInstance.jwt.encode(userInfo);
    let app = express();
    app.use(bodyParser.json());
    app.use('/secure-customer', statelessAuthInstance.secure(), (req, res)=> { 
      expect(res.locals.userInfo.userId).to.equal(userInfo.userId);
      expect(res.locals.userInfo.name).to.equal(userInfo.name);
      res.status(200).json({ success: true }); 
    });
    supertest(app).post('/secure-customer').set('Accept', 'application/json').set('Authorization', 'Bearer ' + token).send().expect(200, done);
  });

  it('should place valid user info on res.local when specified in the local options', done => {
    statelessAuthInstance = statelessAuth({ secure: { reslocal: 'globalUserInfo' }});
    let userInfo = { userId: 'user_id', name: 'Bob' };
    let token = statelessAuthInstance.jwt.encode(userInfo);
    let options = { reslocal: 'userInfo' };
    let app = express();
    app.use(bodyParser.json());
    app.use('/secure-customer', statelessAuthInstance.secure(options), (req, res)=> { 
      expect(res.locals.userInfo.userId).to.equal(userInfo.userId);
      expect(res.locals.userInfo.name).to.equal(userInfo.name);
      res.status(200).json({ success: true }); 
    });
    supertest(app).post('/secure-customer').set('Accept', 'application/json').set('Authorization', 'Bearer ' + token).send().expect(200, done);
  });

});