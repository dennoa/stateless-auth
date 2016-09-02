'use strict';

const jwtSimple = require('jwt-simple');
const expect = require('chai').expect;

const jwt = require('../lib/jwt');

describe('json web token (JWT) encoder / decoder', ()=> {

  let jwtOptions;

  beforeEach(()=> {
    jwtOptions = { secret: 'JWT_SECRET', expiresAfterSecs: 12*60*60 };
  });

  it('should encode data using the provided secret key', ()=> {
    var data = { someData: 'some data', other: 'some other data',  exp: (Date.now() / 1000) + 10 };
    var token = jwt(jwtOptions).encode(data);
    var decoded = jwtSimple.decode(token, jwtOptions.secret);
    expect(decoded.someData).to.equal(data.someData);
    expect(decoded.other).to.equal(data.other);
    expect(decoded.exp).to.equal(data.exp);
  });

  it('should default the expiry when encoding data', ()=> {
    var data = { someData: 'some data', other: 'some other data' };
    var token = jwt(jwtOptions).encode(data);
    var decoded = jwtSimple.decode(token, jwtOptions.secret);
    expect(decoded.someData).to.equal(data.someData);
    expect(decoded.other).to.equal(data.other);
    expect(decoded.exp).to.be.defined;
  });

  it('should decode data using the configured jwt secret key', ()=> {
    var data = { someData: 'some data', other: 'some other data' };
    var token = jwtSimple.encode(data, jwtOptions.secret);
    var decoded = jwt(jwtOptions).decode(token);
    expect(decoded.someData).to.equal(data.someData);
    expect(decoded.other).to.equal(data.other);
  });

  it('should return undefined when attempting to decode data that was encoded using some other key', ()=> {
    var data = { someData: 'some data', other: 'some other data' };
    var token = jwtSimple.encode(data, 'some_other_key');
    var decoded = jwt(jwtOptions).decode(token);
    expect(decoded).to.be.undefined;
  });

  it('should return undefined when attempting to decode data that has expired', ()=> {
    var data = { someData: 'some data', other: 'some other data', exp: (Date.now()/1000) - 1 };
    var token = jwtSimple.encode(data, jwtOptions.secret);
    var decoded = jwt(jwtOptions).decode(token);
    expect(decoded).to.be.undefined;
  });

  it('should return undefined when attempting to decode data in an incorrect format', ()=> {
    var decoded = jwt(jwtOptions).decode('not valid');
    expect(decoded).to.be.undefined;
  });

});
