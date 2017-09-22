'use strict';

function formatError(err) {
  return (err instanceof Error) ? { error: err.message } : err;
}

const withUnauthorised = res => res.status(401).send([{ param: 'credentials', msg: 'unauthorised' }]);

const withError = res => err => {
  return (err) ? res.status(500).send(formatError(err)) : withUnauthorised(res);
};

module.exports = {
  withError,
  withUnauthorised,
};