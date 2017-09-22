'use strict';

const expect = require('chai').expect;

const statelessAuth = require('../lib');

describe('decode authorization header', ()=> {

  let statelessAuthInstance, req;

  beforeEach(()=> {
    statelessAuthInstance = statelessAuth();
    req = {
      get: (key => null)
    };
  });

  it('should decode the jwt from the request Authorization Header', ()=> {
    const userInfo = { ids: { facebook: '214', github: '3432' }, name: 'Johnny', email: 'johnny@home.com',  picture: 'http://johnny.pics.com' };
    const token = statelessAuthInstance.jwt.encode(userInfo);
    req.get = key => {
      return (key === 'Authorization') ? 'Bearer ' + token : null;
    };
    const decoded = statelessAuthInstance.decodeAuthHeader(req);
    expect(decoded.ids.facebook).to.equal(userInfo.ids.facebook);
    expect(decoded.ids.github).to.equal(userInfo.ids.github);
    expect(decoded.name).to.equal(userInfo.name);
    expect(decoded.email).to.equal(userInfo.email);
    expect(decoded.picture).to.equal(userInfo.picture);
  });

  it('should decode a basic authentication request Authorization Header', ()=> {
    const creds = Buffer.from('username:password').toString('base64');
    req.get = key => {
      return (key === 'Authorization') ? 'Basic ' + creds : null;
    };
    const decoded = statelessAuthInstance.decodeAuthHeader(req, { basicAuth: { isEnabled: true } });
    expect(decoded[0]).to.equal('username');
    expect(decoded[1]).to.equal('password');
  });

  it('should return undefined when decoding a basic authentication request where basic-auth is not permitted', ()=> {
    req.get = key => {
      return (key === 'Authorization') ? 'Basic ' + Buffer.from('username:password').toString('base64') : null;
    };
    const decoded = statelessAuthInstance.decodeAuthHeader(req, { basicAuth: { isEnabled: false }});
    expect(typeof decoded).to.equal('undefined');
  });

  it('should return undefined when decoding a basic authentication request where no basic-auth option has been specified', ()=> {
    req.get = key => {
      return (key === 'Authorization') ? 'Basic ' + Buffer.from('username:password').toString('base64') : null;
    };
    const decoded = statelessAuthInstance.decodeAuthHeader(req);
    expect(typeof decoded).to.equal('undefined');
  });

  it('should return undefined when decoding a basic authentication request with no credentials', ()=> {
    req.get = key => {
      return (key === 'Authorization') ? 'Basic' : null;
    };
    const decoded = statelessAuthInstance.decodeAuthHeader(req, { basicAuth: { isEnabled: true } });
    expect(typeof decoded).to.equal('undefined');
  });

});
