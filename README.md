# stateless-auth
Support for authenticated requests without server-side session state

Provides the server-side bits for authentication and retrieval of basic user information from some OAuth2 providers.

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

## Installation

    npm install --save stateless-auth

## Example usage 

### Create an auth module with your configuration options

    module.exports = require('stateless-auth')({
      jwt: { 
        secret: 'MY_APPLICATION_JWT_SECRET' 
      },
      providers: {
        facebook: { 
          clientSecret: 'MY_FACEBOOK_CLIENT_SECRET' 
        },
        login: {
          findUser: (credentials => {
            //TODO: Lookup user info and callback
            //e.g. return UserModel.findOne({ username: credentials.username });
            Promise.reject();
          }
        }
      }
    });

### Route authentication requests

    const auth = require('./auth'); //Your configured auth module

    app.use('/auth', auth.routes);

### Secure other routes

    const auth = require('./auth'); //Your configured auth module

    app.use('/secure', auth.secure());

### Get the swagger docs
Swagger documentation is made available under /swagger by default. So if the auth module is at /auth, then a request like this:

    GET /auth/swagger 

will retrieve the swagger documentation. If you are looking to merge the auth swagger docs with other swagger documentation then you can get the auth docs something like this:

    const auth = require('./auth'); //Your configured auth module

    _.mergeWith({}, auth.swagger, otherSwaggerDocs, concatArrays); //You will want to concat things like the tags array

You will likely want to make use of the swagger.pathPrefix option in this case. 

## All options

### Get all options 

    const auth = require('./auth'); //Your configured auth module

    let authOptions = auth.options;

### Get user information from the JWT on the request

    const auth = require('./auth'); //Your configured auth module

    let userInfo = auth.decodeAuthHeader(req);

### Get the JWT encode / decode functions that use the configured secret key

    const auth = require('./auth'); //Your configured auth module

    let token = auth.jwt.encode({ some: 'data', tobe: 'encoded' });
    let data = auth.jwt.decode(token);

### Route authentication requests

    const auth = require('./auth'); //Your configured auth module

    app.use('/auth', auth.routes);

### Secure other routes

    const auth = require('./auth'); //Your configured auth module

    app.use('/secure', auth.secure()); 

### Include user info from the JWT in res.locals

    const auth = require('./auth'); //Your configured auth module

    app.use('/secure', auth.secure({ reslocal: 'userInfo' })); //Puts decoded JWT user info into res.locals.userInfo 

### Support basic authentication access in addition to JWT
Basic authentication uses the login provider to retrieve user details and validate credentials. It cannot be used without a login provider implementation.

    const auth = require('./auth'); //Your configured auth module

    app.use('/secure', auth.secure({ basicAuth: true })); 

## Global options
Any of the default options can be overridden. See below for an explanation and the default options.

Note: {{provider}} is one of facebook, google, github or linkedin. See below for details of default login provider support.

* jwt.secret is used to create a JWT from the user info and to decode the JWT on subsequent requests. Set this to something that only your application knows about.
* jwt.expiresAfterSecs determines how long it takes for a JWT to expire.
* jwtCookie.isEnabled determines whether or not authentication is supported via a cookie in addition to the normal Authorization header.
* jwtCookie.name is the name of the cookie that contains the jwt.
* providers.{{provider}}.tokenEndpoint is the endpoint for the token request.
* providers.{{provider}}.userInfoEndpoint is the endpoint for the user info request.
* providers.{{provider}}.clientSecret is the client secret configured at the provider end. Set this to the relevant value from your provider application.
* providers.{{provider}}.standardiseUserInfo is the function used to transform user information from the provider into a standard format for your application.
  This function is passed user information returned by the provider (1st arg) as well as the request body (2nd arg). It returns user information in the format appropriate to your application.
* providers.{{provider}}.standardiseUserInfoForCookie overrides standardiseUserInfo when deternmining the details for the cookie jwt. If not specified, the standardiseUserInfo function will be used.
* providers.{{provider}}.tokenEndpointRequiresFormPost is used by the default mechanism for retrieving the access token. If truthy, data sent to the provider will
  be as a form on a POST request. If falsy, data will be sent as a querystring on a GET request.
* providers.{{provider}}.userInfoEndpointAuthorizationHeader is used by the default mechanism for retrieving user information. If specified, the value will be used to
  construct an Authorization header containing the access token. If not specified, the access token will be sent to the provider as a querystring.
* providers.login configures the default mechanism for authenticating with a username and password. See below for more details on configuring this option.
* proxy should be set to the address of your proxy server if you are running in an environment where access to the OAuth2 provider is via a corporate proxy or something similar.
* secure.reslocal can be set to the name of a property on "res.locals" where the decoded JWT for the current request should be put. Use this to specify a variable name that will
  be used wherever the auth.secure() middleware is used. Note that the variable name specified here can be overridden by any individual auth.secure() instance as outlined above.
* secure.basicAuth can be set to true to allow any valid basic authentication request to gain access to the secured path.
* swagger.path is the subpath for retrieving the swagger documentation for the various authentication operations. E.g. GET /auth/swagger.
* swagger.pathPrefix will be prepended to each of the provider paths. For example, you could set swagger.docs.basePath to '/' and swagger.pathPrefix to '/auth'. Useful if you
  want to merge the auth swagger docs into your application swagger docs and the basePath needs to apply to the application docs.
* swagger.docs is used to override the default swagger documentation. At the very least you will likely want to override the info section, but any other aspects of the
  documentation including paths and definitions can also be overridden here. Refer to <https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md> for details
  of the swagger specification.

### Default options

    module.exports = require('stateless-auth')({
  
      jwt: {
        secret: 'JWT_SECRET',
        expiresAfterSecs: 12*60*60
      },

      jwtCookie: {
        isEnabled: false,
        name: 'jwt'
      },

      providers: {

        facebook: {
          tokenEndpoint: 'https://graph.facebook.com/v2.5/oauth/access_token',
          userInfoEndpoint: 'https://graph.facebook.com/v2.5/me?fields=id,email,first_name,last_name,link,name',
          clientSecret: 'CLIENT_SECRET',
          standardiseUserInfo: userInfo => ({
            ids: { facebook: userInfo.id },
            email: userInfo.email,
            name: userInfo.name,
            picture: `https://graph.facebook.com/v2.5/${userInfo.id}/picture?type=large`
          }),
          standardiseUserInfoForCookie: null,
        },

        github: {
          tokenEndpoint: 'https://github.com/login/oauth/access_token',
          userInfoEndpoint: 'https://api.github.com/user',
          clientSecret: 'CLIENT_SECRET',
          standardiseUserInfo: userInfo => ({
            ids: { github: userInfo.id },
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.avatar_url
          }),
          standardiseUserInfoForCookie: null,
          userInfoEndpointAuthorizationHeader: 'token'
        },

        google: {
          tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
          userInfoEndpoint: 'https://www.googleapis.com/oauth2/v3/userinfo',
          clientSecret: 'CLIENT_SECRET',      
          standardiseUserInfo: userInfo => ({
            ids: { google: userInfo.sub },
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture
          }),
          standardiseUserInfoForCookie: null,
          tokenEndpointRequiresFormPost: true,
          userInfoEndpointAuthorizationHeader: 'Bearer'
        },

        linkedin: {
          tokenEndpoint: 'https://www.linkedin.com/uas/oauth2/accessToken',
          userInfoEndpoint: 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)?format=json',
          clientSecret: 'CLIENT_SECRET',      
          standardiseUserInfo: userInfo => ({
            ids: { linkedin: userInfo.id },
            email: userInfo.emailAddress,
            name: userInfo.firstName + ' ' + userInfo.lastName,
            picture: userInfo.pictureUrl
          }),
          standardiseUserInfoForCookie: null,
          tokenEndpointRequiresFormPost: true,
          userInfoEndpointAuthorizationHeader: 'Bearer'
        },

        login: {
          handler: loginHandler,
          standardiseUserInfo: userInfo => ({
            ids: { login: userInfo.username },
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture
          }),
          standardiseUserInfoForCookie: null,
          grantType: 'password',
          findUser: () => Promise.reject({ error: 'An implementation for findUser must be provided' }),
          hashPassword: simpleHash,
          comparePassword: (password, passwordHash) => Promise.resolve(simpleHash(password) === passwordHash),
          modelmap: {
            credentials: { username: 'username', password: 'password' },
            userInfo: { passwordHash: 'passwordHash' }
          }
        }

      },

      proxy: null,

      secure: {
        reslocal: null,
        basicAuth: false
      },

      swagger: {
        path: '/swagger',
        pathPrefix: '',
        docs: {
          swagger: '2.0',
          info: {
            title: 'Authentication API',
            description: 'Authentication API',
            version: '1.0'
          },
          basePath: '/auth',
          consumes: ['application/json'],
          produces: ['application/json'],
          tags: [
            { name: 'authentication', description: 'authentication' }
          ]
        }
      }

    });

### Default login options
The default implementation for logging in with a username and password assumes the application holds a hash of the password as part of the user info (no actual password should
be stored). It looks for username and password properties on the auth/login request and a passwordHash property on the user info model. (These names can be overridden).

At a minimum, a custom findUser function must be provided. The default implementation calls back with an error reminding you to provide an implementation appropriate to your
application. 

Full default login options are listed with the global options above.

* login.handler specifies the login handler. See the section below on adding another provider if you want to implement your own login handler rather than use the default.
  If you use your own login handler, then the rest of the configuration options are not really relevant.
* login.standardiseUserInfo maps the user info from the login.findUser function to the standard format used by your application. See global options above for more details
  about this. You will likely want to change this to conform with the format of the user info supplied by your login.findUser function.
* login.findUser MUST be overridden by your application-specific implementation. If you are using mongoose you might code something like this:

        module.exports = require('stateless-auth')({
          providers: {
            login: {
              findUser: (credentials => UserModel.findOne({ username: credentials.username }))
            }
          }
        });

  The credentials passed to login.findUser will be whatever is posted on the /auth/login request.
* login.hashPassword is no longer used but has been retained for backward compatibility. The default implementation is sha256 formatted as base64. If you call this function from other places - e.g. during user registration or any password update facility where you will need to save a hashed password - then you can navigate the options to gain access to the hashPassword function like this:

        const auth = require('./auth'); //Your configured auth module

        const hashPassword = auth.options.providers.login.hashPassword;

* login.comparePassword is used to compare a password with a hash. It returns a Promise that resolves to a truthy or falsy value depending on whether or not the password matches the hash. The default implementation hashes the password with sha256 formatted as base64 and compares the result to the provided hash. You can override this function something like this:

        module.exports = require('stateless-auth')({
          providers: {
            login: {
              comparePassword: (password, passwordHash) => Promise.resolve(hashIt(password) === passwordHash)
            }
          }
        });

* login.modelmap.credentials.password specifies the name of the property that holds the password as posted on the /auth/login request. Override this if you want to use a name
  other than 'password' such as 'loginPassword' for example.
* login.modelmap.userInfo.passwordHash specifies the name of the property on the user info model that holds the password hash. Override this if you want to use a name
  other than 'passwordHash'.

## Adding another provider
You can add additional providers by simply adding them to the configuration options. If the implementation for retrieving the access token and subsequently the basic user
information follows the same mechanism as those above, then there should be nothing else to do. The default handler implementation should suffice.

If you need a different handler implementation for any reason, you can configure a handler function for your provider. For example:

    function mySpecialHandler(options) {
      
      //options are from the configuration specific to this provider, plus the global proxy config.
      //Whatever you set in the provider options will be passed through except for the reference to this handler function and standardiseUserInfo (if specified).

      return (tokenParams => {

        //Note that tokenParams will contain the entire request body merged with the relevant client_secret and a grant_type of 'authorization_code'
        //Lookup the access token using the tokenParams
        //Lookup the user info using the access token
        //return a Promise.resolve(userInfo) or Promise.reject(err). Promise.reject with an error will return a statusCode 500, with no error will return 401. 
      };
    }

    module.exports = require('stateless-auth')({
      providers: {
        someprovider: {
          mySpecialConfig: { what: 'ever' },
          handler: mySpecialHandler
        }
      }
    });
    