'use strict';

const _ = require('lodash');
const defaultOptions = require('./options');

function replaceArrays(target, source) {
  return (target instanceof Array) ? source : undefined;
}

module.exports = options => _.mergeWith({}, defaultOptions, options, replaceArrays);
