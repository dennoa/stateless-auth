'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const supertest = require('supertest');
const expect = require('chai').expect;

const jwt = require('../lib/jwt');
const lite = require('../lib/lite');

describe('lite stateless authentication', ()=> {

  let liteInstance, secureOptions, requestHandler, userInfo;

  beforeEach(()=> {
    liteInstance = lite({
      jwtCookie: { isEnabled: true },
      secure: { reslocal: 'userInfo' }
    });
    secureOptions = {},
    requestHandler = (req, res, next) => res.status(204).send();
    userInfo = { username: 'bob' };
  });

  function prepRequest() {
    const app = express();
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use('/secure', liteInstance.secure(secureOptions), (req, res, next) => requestHandler(req, res, next));
    return supertest(app).post('/secure').set('Accept', 'application/json');
  }

  function sendRequest(data, overrideToken) {
    const token = overrideToken || jwt(liteInstance.options.jwt).encode(userInfo);
    return prepRequest().set('Authorization', `Bearer ${token}`).send(data);
  }

  function sendCookieRequest(data, overrideToken) {
    const token = overrideToken || jwt(liteInstance.options.jwt).encode(userInfo);
    return prepRequest().set('Cookie', [`jwt=${token}; Path=/`]).send(data);
  }

  it('should decode the jwt and place the result on res.locals', done => {
    requestHandler = (req, res) => res.status(200).json(res.locals.userInfo);
    sendRequest().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.body.username).to.equal(userInfo.username);
      done();
    });
  });

  it('should allow the reslocal name to be overridden for a particular secure middleware instance', done => {
    secureOptions = { reslocal: 'data' };
    requestHandler = (req, res) => res.status(200).json(res.locals.data);
    sendRequest().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.body.username).to.equal(userInfo.username);
      done();
    });
  });

  it('should expose the function to decode the auth header', done => {
    let decoded;
    requestHandler = (req, res) => {
      decoded = liteInstance.decodeAuthHeader(req);
      res.status(204).send();
    };
    sendRequest().end((err, res) => {
      expect(decoded.username).to.equal(userInfo.username);
      done();
    });
  });

  it('should support cookie authentication', done => {
    requestHandler = (req, res) => res.status(200).json(res.locals.userInfo);
    sendCookieRequest().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.body.username).to.equal(userInfo.username);
      done();
    });
  });

});