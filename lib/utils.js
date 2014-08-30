'use strict';

exports.handleMileniumBug = function (date) {
  var currentYear = (new Date()).getUTCFullYear();
  if (date.getUTCFullYear() > currentYear + 4) {
    date.setUTCFullYear(date.getUTCFullYear() - 100);
  }
  return date;
};
