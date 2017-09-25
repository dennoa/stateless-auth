'use strict';

function sendError(res, err) {
  if (err.errors) { return res.status(400).json(err.errors); }
  if (err.toJSON) { return res.status(400).json(err.toJSON()); }
  return res.status(500).send((err instanceof Error) ? { error: err.message } : err);
}

const withUnauthorised = res => res.status(401).send([{ param: 'credentials', msg: 'unauthorised' }]);

const withError = res => err => {
  return (err) ? sendError(res, err) : withUnauthorised(res);
};

module.exports = {
  withError,
  withUnauthorised,
};
