# stateless-auth
Support for authenticated requests without server-side session state

Provides the server-side bits for authentication and retrieval of basic user information from various OAuth2 providers.

Currently supports authentication with:
* facebook
* github
* google
* linkedin

The process is like this:
* The client makes a request to the authorization endpoint of your target provider using the relevant OAuth2 client id or public key.
  For example, a request to https://accounts.google.com/o/oauth2/v2/auth with your google client id (plus some other stuff).
* The provider authenticates the user and redirects to the specified location with a code.
* The client posts the code along with the client id and redirect uri to something like /auth/google (handled by the stateless-auth module).
* stateless-auth communicates with the target provider (e.g. google) to retrieve basic user details: id, name, email and picture url.
* stateless-auth creates a signed Json Web Token (JWT) from the user details and responds with both the JWT and the unencoded user details.
* Each request that requires authentication includes the JWT in the Authorization Header.
*   

## Installation

  npm install --save stateless-auth

## Example usage  

  const express = require('express');
  const bodyParser = require('body-parser');

  const options = {
    jwt: { secret: 'MY_APPLICATION_JWT_SECRET' },
    providers: {
      facebook: { clientSecret: 'MY_FACEBOOK_CLIENT_SECRET' }
    }
  };
  const statelessAuth = require('stateless-auth')(options);

  const app = express();
  app.use(bodyParser.json());
  app.use('/auth', statelessAuth.routes);
  app.use('/secure', statelessAuth.verifier);




