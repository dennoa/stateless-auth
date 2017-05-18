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
    const data = { someData: 'some data', other: 'some other data',  exp: (Date.now() / 1000) + 10 };
    const token = jwt(jwtOptions).encode(data);
    const decoded = jwtSimple.decode(token, jwtOptions.secret);
    expect(decoded.someData).to.equal(data.someData);
    expect(decoded.other).to.equal(data.other);
    expect(decoded.exp).to.equal(data.exp);
  });

  it('should default the expiry when encoding data', ()=> {
    const data = { someData: 'some data', other: 'some other data' };
    const token = jwt(jwtOptions).encode(data);
    const decoded = jwtSimple.decode(token, jwtOptions.secret);
    expect(decoded.someData).to.equal(data.someData);
    expect(decoded.other).to.equal(data.other);
    expect(decoded.exp).to.be.closeTo(Math.round(Date.now() / 1000) + jwtOptions.expiresAfterSecs, 2);
  });

  it('should allow the expiry to be determined by a function', ()=> {
    jwtOptions.expiresAfterSecs = () => 60;
    const data = { someData: 'some data', other: 'some other data' };
    const token = jwt(jwtOptions).encode(data);
    const decoded = jwtSimple.decode(token, jwtOptions.secret);
    expect(decoded.exp).to.be.closeTo(Math.round(Date.now() / 1000) + jwtOptions.expiresAfterSecs(), 2);
  });

  it('should decode data using the configured jwt secret key', ()=> {
    const data = { someData: 'some data', other: 'some other data' };
    const token = jwtSimple.encode(data, jwtOptions.secret);
    const decoded = jwt(jwtOptions).decode(token);
    expect(decoded.someData).to.equal(data.someData);
    expect(decoded.other).to.equal(data.other);
  });

  it('should return undefined when attempting to decode data that was encoded using some other key', ()=> {
    const data = { someData: 'some data', other: 'some other data' };
    const token = jwtSimple.encode(data, 'some_other_key');
    const decoded = jwt(jwtOptions).decode(token);
    expect(decoded).to.be.undefined;
  });

  it('should return undefined when attempting to decode data that has expired', ()=> {
    const data = { someData: 'some data', other: 'some other data', exp: (Date.now()/1000) - 1 };
    const token = jwtSimple.encode(data, jwtOptions.secret);
    const decoded = jwt(jwtOptions).decode(token);
    expect(decoded).to.be.undefined;
  });

  it('should return undefined when attempting to decode data in an incorrect format', ()=> {
    const decoded = jwt(jwtOptions).decode('not valid');
    expect(decoded).to.be.undefined;
  });

});
