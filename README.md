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
            return Promise.reject(new Error('Not Implemented));
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

    const authOptions = auth.options;

### Get user information from the JWT on the request

    const auth = require('./auth'); //Your configured auth module

    const userInfo = auth.decodeAuthHeader(req);

### Get the JWT encode / decode functions that use the configured secret key

    const auth = require('./auth'); //Your configured auth module

    const token = auth.jwt.encode({ some: 'data', tobe: 'encoded' });
    const data = auth.jwt.decode(token);

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
Basic authentication requires a login handler to retrieve user details and validate credentials. By default it uses the login provider handler implementation.

    const auth = require('./auth'); //Your configured auth module

    // Use the login provider handler implementation
    app.use('/secure', auth.secure({ basicAuth: { isEnabled: true } }));

    // Use a different login handler
    function loginHandler(creds) {
      const username = creds[0];
      const password = creds[1];
      const userInfo = login(username, password);
      return userInfo;
    }
    app.use('/secure', auth.secure({ basicAuth: { isEnabled: true, loginHandler } }));

## Global options
Any of the default options can be overridden. See below for an explanation and the default options.

Note: {{provider}} is one of facebook, google, github or linkedin. See below for details of default login provider support.

* jwt.secret is used to create a JWT from the user info and to decode the JWT on subsequent requests. Set this to something that only your application knows about.
* jwt.expiresAfterSecs determines how long it takes for a JWT to expire. This can be a number or a function that returns a number.
* jwtCookie.isEnabled determines whether or not authentication is supported via a cookie in addition to the normal Authorization header. To enable cookie authentication, you must also include the cookie-parser middleware for express.
* jwtCookie.name is the name of the cookie that contains the jwt.
* providers.{{provider}}.tokenEndpoint is the endpoint for the token request.
* providers.{{provider}}.userInfoEndpoint is the endpoint for the user info request.
* providers.{{provider}}.clientSecret is the client secret configured at the provider end. Set this to the relevant value from your provider application.
* providers.{{provider}}.standardiseUserInfo is the function used to transform user information from the provider into a standard format for your application.
  This function is passed user information returned by the provider (1st arg) as well as the request body (2nd arg) and response (3rd arg). It returns user information in the format appropriate to your application.
* providers.{{provider}}.standardiseUserInfoForCookie overrides standardiseUserInfo when deternmining the details for the cookie jwt. If not specified, the standardiseUserInfo function will be used.
* providers.{{provider}}.tokenEndpointRequiresFormPost is used by the default mechanism for retrieving the access token. If truthy, data sent to the provider will
  be as a form on a POST request. If falsy, data will be sent as a querystring on a GET request.
* providers.{{provider}}.userInfoEndpointAuthorizationHeader is used by the default mechanism for retrieving user information. If specified, the value will be used to
  construct an Authorization header containing the access token. If not specified, the access token will be sent to the provider as a querystring.
* providers.{{provider}}.excludeFromRoutes can be set to true to exclude this provider from the available routes.
* providers.login configures the default mechanism for authenticating with a username and password. See below for more details on configuring this option.
* proxy should be set to the address of your proxy server if you are running in an environment where access to the OAuth2 provider is via a corporate proxy or something similar.
* secure.reslocal can be set to the name of a property on "res.locals" where the decoded JWT for the current request should be put. Use this to specify a variable name that will
  be used wherever the auth.secure() middleware is used. Note that the variable name specified here can be overridden by any individual auth.secure() instance as outlined above.
* secure.basicAuth.isEnabled can be set to true to allow any valid basic authentication request to gain access to the secured path.
* swagger.path is the subpath for retrieving the swagger documentation for the various authentication operations. E.g. GET /auth/swagger.
* swagger.pathPrefix will be prepended to each of the provider paths. For example, you could set swagger.docs.basePath to '/' and swagger.pathPrefix to '/auth'. Useful if you
  want to merge the auth swagger docs into your application swagger docs and the basePath needs to apply to the application docs.
* swagger.docs is used to override the default swagger documentation. At the very least you will likely want to override the info section, but any other aspects of the
  documentation including paths and definitions can also be overridden here. Refer to <https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md> for details
  of the swagger specification.

### Default options
lib/options.js holds the default options.

### Default login options
The default implementation for logging in with a username and password assumes the application holds a hash of the password as part of the user info. It looks for username and password properties on the auth/login request and a passwordHash property on the user info model. (These names can be overridden).

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
* login.passwordSupport is an object with a compare function that compares a password with a hash. The compare function returns a truthy or falsy value depending on whether or not the password matches the hash. It can also return a Promise that resolves to a truthy or falsy value. The default passwordSupport implementation uses bcrypt with 10 rounds to generate salted hashes. You can override it something like this:

        module.exports = require('stateless-auth')({
          providers: {
            login: {
              passwordSupport: {
                compare: (password, passwordHash) => Promise.resolve(hashIt(password) === passwordHash)
              }
            }
          }
        });

The default passwordSupport implementation provides hash and compare functions. To use the hash function that corresponds with the default compare:

        auth.options.providers.login.passwordSupport.hash(somePassword).then(passwordHash => {
          //save the passwordHash for subsequent authentication
        });

The factory that creates the default passwordSupport instance can be used with a different number of rounds to generate salted hashes:

        const statelessAuth = require('stateless-auth');
        module.exports = statelessAuth({
          providers: {
            login: {
              passwordSupport: statelessAuth.passwordSupport({ rounds: 12 })
            }
          }
        });

* login.modelMap.credentials.password specifies the name of the property that holds the password as posted on the /auth/login request. Override this if you want to use a name
  other than 'password' such as 'loginPassword' for example.
* login.modelMap.userInfo.passwordHash specifies the name of the property on the user info model that holds the password hash. Override this if you want to use a name
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
    
## Available from your stateless-auth instance

    const auth = require('./auth'); // Your configured auth module

    auth.options; // Reference the configuration options used by this auth instance
    auth.decodeAuthHeader; // Function to decode the authorization header
    auth.jwt; // jwt instance for jwt.encode and jwt.decode functions
    auth.routes; // Routes for express
    auth.routeHandlers; // Middleware handlers for each of the routes, e.g. routeHandlers.facebook, routeHandlers.login, etc.
    auth.secure; // Middleware for securing routes
    auth.swagger; // The swagger docs describing the stateless auth operations

# stateless-auth/lite
Provides just the token verification bits - no login handlers. 

Note that if you want to support basic authentication you will need to provide a secure.basicAuth.loginHandler implementation. See above for details on implementing one of those.

## Example usage 

### Create a lite auth module with your configuration options

    const liteAuth = require('stateless-auth/lite')({
      jwt: {
        secret: 'MY_SECRET',
      },
    });

The default options relevant to the lite auth functions are:

    jwt: {
      secret: 'JWT_SECRET',
      expiresAfterSecs: 12*60*60,
    },
    jwtCookie: {
      isEnabled: false,
      name: 'jwt',
    },
    secure: {
      reslocal: null,
      basicAuth: { isEnabled: false, loginHandler: null },
    },


### Use the lite auth functions

    const opts = liteAuth.options; // The provided options combined with the defaults.
    
    const decoded = decodeAuthHeader(req); // Decodes the JWT on the Authorization header or from the cookie if jwtCookie.isEnabled

    app.use('/secure', secure(), myRequestHandler); // Use the secure express middleware. See above for secure options

#stateless-auth/password-support
To just get the password support functionality without other bits:

    const passwordSupport = require('stateless-auth/password-support')({
      rounds: 10,
    });

This uses <https://www.npmjs.com/package/bcrypt> to generate the salt and password hash. Rounds are the salted rounds provided to bcrypt - more rounds = higher cost of processing so more expensive to brute-force attack. Default is 10. 

Note: If you include the password hash function in unit tests then you might want to set the rounds to 1 to speed things along a bit.
