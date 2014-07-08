'use strict';

var assert = require('assert');
var pipermail = require('pipermail');
var Promise = require('promise');

var readIndex = pipermail.readIndex;
var readMonth = pipermail.readMonth;
var readMessage = pipermail.readMessage;

module.exports = Pipermail;
function Pipermail(id, url, options) {
  this.id = id;
  this.url = url.replace(/([^\/])\/?$/g, '$1/');
  this.options = options;
}
Pipermail.prototype.getMessages = function () {
  return readIndex(this.url).then(function (months) {
    return Promise.all(months.reverse().map(function (month) {
      return readMonth(month);
    }));
  }).then(function (messages) {
    return messages.reduce(function (a, b) {
      return a.concat(b.reverse());
    }, []);
  });
};
Pipermail.prototype.getMessage = function (url) {
  assert(url.substr(0, this.url.length) === this.url);
  return readMessage(url).then(function (message) {
    return {
      url: message.url,
      reply: message.header.reply,
      subject: message.header.subject,
      from: { email: message.header.from.email, name: message.header.from.name },
      date: message.header.date,
      body: message.body
    };
  });
};
