'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');

const statelessAuth = require('../lib');

describe('secure routes with cookie', ()=> {

  let statelessAuthInstance, app, providers;

  beforeEach(()=> {
    providers = {
      login: {
        findUser: () => ({ username: 'bob' }),
        comparePassword: () => true,
      }
    };
    statelessAuthInstance = statelessAuth({ jwtCookie: { isEnabled: true }, providers });
    app = express();
    app.use(bodyParser.json());
    app.use(cookieParser());
  });

  const login = () => {
    app.use(statelessAuthInstance.routes);
    return supertest(app).post('/login').set('Accept', 'application/json').send({ username: 'bob', password: 'pass' });
  };

  function sendRequest(path, cookie) {
    app.use(path, statelessAuthInstance.secure(), (req, res)=> { res.status(200).json({ success: true }); });
    const req = supertest(app)
      .get(path)
      .set('Accept', 'application/json');
    if (cookie) {
      req.set('Cookie', cookie);
    }
    return req.send();
  }

  const getCookieBits = res => res.headers['set-cookie'][0].split(';')[0].split('=');

  it('should include a jwt cookie on the authentication response', done => {
    login().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      const cookieBits = getCookieBits(res);
      const name = cookieBits[0];
      const token = statelessAuthInstance.jwt.decode(cookieBits[1]);
      expect(name).to.equal(statelessAuthInstance.options.jwtCookie.name);
      expect(token.ids).to.deep.equal({ login: 'bob' });
      done();
    });
  });

  it('should support special standardisation of the user info for a jwt cookie', done => {
    providers.login.standardiseUserInfoForCookie = (userInfo, reqBody) => ({ custom: { one: userInfo.username, two: reqBody.password } });
    statelessAuthInstance = statelessAuth({ jwtCookie: { isEnabled: true }, providers });
    login().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      const cookieBits = getCookieBits(res);
      const token = statelessAuthInstance.jwt.decode(cookieBits[1]);
      expect(token.custom).to.deep.equal({ one: 'bob', two: 'pass' });
      done();
    });
  });

  it('should not include a jwt cookie on the authentication response unless configured to do so', done => {
    statelessAuthInstance = statelessAuth({ jwtCookie: { isEnabled: false }, providers });
    login().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      expect(typeof res.headers['set-cookie']).to.equal('undefined');
      done();
    });
  });

  it('should use the cookie to authenticate subsequent requests', done => {
    login().end((err, res) => {
      sendRequest('/secure', res.headers['set-cookie']).end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.deep.equal({ success: true });
        done();
      });
    });
  });

  it('should fail authentication if the cookie is not sent', done => {
    login().end((err, res) => {
      sendRequest('/secure').end((err, res) => {
        expect(res.statusCode).to.equal(401);
        done();
      });
    });
  });

  it('should fail authentication if the cookie is not valid', done => {
    login().end((err, res) => {
      sendRequest('/secure', ['jwt=invalid; Path=/']).end((err, res) => {
        expect(res.statusCode).to.equal(401);
        done();
      });
    });
  });

});