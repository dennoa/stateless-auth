'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const supertest = require('supertest');
const expect = require('chai').expect;
const _ = require('lodash');

const statelessAuth = require('../lib');

describe('swagger documentation', ()=> {

  let statelessAuthInstance;

  beforeEach(()=> {
    statelessAuthInstance = statelessAuth();
  });

  function requestSwaggerDocs() {
    const docOptions = statelessAuthInstance.options.swagger.docs;
    const app = express();
    app.use(bodyParser.json());
    app.use(docOptions.basePath, statelessAuthInstance.routes);
    return supertest(app)
      .get(docOptions.basePath + '/swagger')
      .set('Accept', 'application/json')
      .send();
  }

  it('should provide default swagger document information when specific options are not configured', done => {
    requestSwaggerDocs().expect(200).end((err, res) => {
      ['swagger', 'info', 'basePath', 'consumes', 'produces', 'tags'].forEach(key => {
        expect(!!res.body[key]).to.equal(true);
        expect(res.body[key]).to.deep.equal(statelessAuthInstance.options.swagger.docs[key]);
      });
      done();
    });    
  });

  it('should allow the swagger document information to be modified', done => {
    const customOptions = {
      swagger: { 
        docs: {
          info: {
            title: 'My super app authentication stuff',
            description: 'My excellent description',
            version: '2.0'
          },
          basePath: '/login',
        } 
      }
    };
    statelessAuthInstance = statelessAuth(customOptions);    
    requestSwaggerDocs().expect(200).end((err, res) => {
      expect(res.body.swagger.info).to.deep.equal(customOptions.info);
      expect(res.body.swagger.basePath).to.equal(customOptions.basePath);
      done();
    });    
  });

  it('should list operations for each provider', done => {
    requestSwaggerDocs().expect(200).end((err, res) => {
      _.forEach(statelessAuthInstance.options.providers, (value, provider) => {
        expect(!!res.body.paths['/' + provider]).to.equal(!value.excludeFromRoutes);
      });
      done();
    });
  });

  it('should provide definitions for the operations scoped using the basePath and pathPrefix', done => {
    requestSwaggerDocs().expect(200).end((err, res) => {
      ['authorization_code', 'username_password', 'jwt_user'].forEach(name => {
        expect(!!res.body.definitions['auth_' + name]).to.equal(true);
      });
      done();
    });    
  });

  it('should allow the swagger paths and definitions to be modified', done => {
    const customOptions = {
      swagger: { 
        docs: {
          basePath: '/my-authentication',
          paths: {
            '/login': {
              post: {
                parameters: [{
                  name: 'email_password',
                  in: 'body',
                  schema: {
                    $ref: '#/definitions/my-authentication_email_password'
                  }
                }]
              }
            }
          },
          definitions: {
            'my-authentication_email_password': {
              type: 'object',
              description: 'Email and password request parameters',
              required: ['email','password'],
              properties: {
                email: { type: 'string', description: 'Email' },
                password: { type: 'string', description: 'Password' }
              }
            }
          }
        } 
      }
    };
    statelessAuthInstance = statelessAuth(customOptions);    
    requestSwaggerDocs().expect(200).end((err, res) => {
      expect(res.body.paths['/login'].post.parameters).to.deep.equal(customOptions.swagger.docs.paths['/login'].post.parameters);
      expect(res.body.definitions['my-authentication_email_password']).to.deep.equal(customOptions.swagger.docs.definitions['my-authentication_email_password']);
      done();
    });    
  });

  it('should allow the swagger tag description to be modified', done => {
    const customOptions = {
      swagger: { 
        docs: {
          tags: [
            { name: 'authentication', description: 'Authentication' }
          ]
        }
      }
    };
    statelessAuthInstance = statelessAuth(customOptions);    
    requestSwaggerDocs().expect(200).end((err, res) => {
      expect(res.body.tags[0]).to.deep.equal(customOptions.swagger.docs.tags[0]);
      done();
    });    
  });

  it('should allow specification of a path prefix to be applied to all paths', (done) => {
    const customOptions = {
      swagger: {
        pathPrefix: '/prefix'
      }
    };
    statelessAuthInstance = statelessAuth(customOptions);
    requestSwaggerDocs().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      _.forEach(statelessAuthInstance.options.providers, (value, provider) => {
        expect(!!res.body.paths['/prefix/' + provider]).to.equal(!value.excludeFromRoutes);
      });
      done();
    });    
  });

  it('should make the swagger docs available to be merged into other swagger docs', (done) => {
    requestSwaggerDocs().end((err, res) => {
      expect(res.statusCode).to.equal(200);
      expect(statelessAuthInstance.swagger).to.deep.equal(res.body);
    });
    done();
  });

});