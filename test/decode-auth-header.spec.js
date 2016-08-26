'use strict';

const expect = require('chai').expect;

const statelessAuth = require('../lib');

describe('Decode Authorization Header', ()=> {

  let statelessAuthInstance, req;

  beforeEach(()=> {
    statelessAuthInstance = statelessAuth();
    req = {
      get: (key => null)
    };
  });

  it('should decode the request Authorization Header', ()=> {
    let userInfo = { ids: { facebook: '214', github: '3432' }, name: 'Johnny', email: 'johnny@home.com',  picture: 'http://johnny.pics.com' };
    let token = statelessAuthInstance.jwt.encode(userInfo);
    req.get = key => {
      return (key === 'Authorization') ? 'Bearer ' + token : null;
    };
    let decoded = statelessAuthInstance.decodeAuthHeader(req);
    expect(decoded.ids.facebook).to.equal(userInfo.ids.facebook);
    expect(decoded.ids.github).to.equal(userInfo.ids.github);
    expect(decoded.name).to.equal(userInfo.name);
    expect(decoded.email).to.equal(userInfo.email);
    expect(decoded.picture).to.equal(userInfo.picture);
  });

});
