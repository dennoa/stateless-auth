'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const bcrypt = require('bcryptjs');
const passwordSupport = require('../password-support');

describe('password-support', () => {

  const clearTextPassword = 'my passw0rd!';
  let instance;

  before(() => {
    instance = passwordSupport({ rounds: 1 });
  });

  it('should hash and compare a password', done => {
    instance.hash(clearTextPassword)
      .then(hash => instance.compare(clearTextPassword, hash))
      .then(result => {
        expect(result).to.equal(true);
        done();
      });
  });

  describe('error handling', () => {
    const expectedError = 'Expected for testing';

    beforeEach(() => {
      sinon.stub(bcrypt, 'genSalt').yields(null, 'salt');
      sinon.stub(bcrypt, 'hash').yields(null, 'hash');
    });

    afterEach(() => {
      bcrypt.genSalt.restore();
      bcrypt.hash.restore();
    });

    it('should reject with an error if bcrypt fails to generate a salt', done => {
      bcrypt.genSalt.yields(expectedError);
      instance.hash(clearTextPassword).catch(err => {
        expect(err).to.equal(expectedError);
        done();
      });
    });

    it('should reject with an error if bcrypt fails to hash the password', done => {
      bcrypt.hash.yields(expectedError);
      instance.hash(clearTextPassword).catch(err => {
        expect(err).to.equal(expectedError);
        done();
      });
    });
  });

});
