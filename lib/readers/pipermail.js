'use strict';

var assert = require('assert');
var pipermail = require('pipermail');

module.exports = messages
function messages(source) {
  var url = source.url.replace(/([^\/])\/?$/g, '$1/')
  return pipermail(url, source);
}
