'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const supertest = require('supertest');
const expect = require('chai').expect;
const sinon = require('sinon');

const statelessAuth = require('../lib');

describe('stateless-auth', ()=> {

  let statelessAuthInstance;

  beforeEach(()=> {
    statelessAuthInstance = statelessAuth();
  });

  function sendRequestToBeVerified(path, token) {
    let app = express();
    app.use(bodyParser.json());
    app.use(path, statelessAuthInstance.verifier, (req, res)=> { res.status(200).json({ success: true }); });
    let req = supertest(app)
      .post(path)
      .set('Accept', 'application/json');
    if (token) {
      req.set('Authorization', 'Bearer ' + token);
    }
    return req.send();
  }

  it('should deny access to secure paths where no authentication header has been provided', (done)=> {
    sendRequestToBeVerified('/secure').expect(401, done);
  });

  it('should deny access to secure paths where an invalid authentication header has been provided', (done)=> {
    let differentSecret = { jwt: { secret: 'some other secret' } };
    let invalidToken = statelessAuth(differentSecret).jwt.encode({ userId: 'user_id', name: 'Bob' });
    sendRequestToBeVerified('/secure', invalidToken).expect(401, done);
  });

  it('should allow access to secure paths where a valid authentication header has been provided', (done)=> {
    let token = statelessAuthInstance.jwt.encode({ userId: 'user_id', name: 'Bob' });
    sendRequestToBeVerified('/secure', token).expect(200, done);
  });

});