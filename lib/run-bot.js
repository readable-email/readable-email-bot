'use strict';

var Promise = require('promise');

module.exports = runBot;
function runBot(database, source) {
  var messageHandlers = [];
  function onMessage(message) {
    for (var i = 0; i < messageHandlers.length; i++) {
      messageHandlers[i](message);
    }
  }
  var result = new Promise(function (resolve, reject) {
    source.filterMessage = function (url) {
      return database.processedMessage.find({_id: url}).count().then(function (count) {
        return count === 0;
      }, function () {
        return true;
      });
    };
    var sourceStream = pipermail(source).filter(function (message) {
      //filter spam
      if (/spam/i.test(message.header.subject) || /no subject/i.test(message.header.subject)) {
        return false
      }
      // update/add some extra properties
      assert(!/\/\//.test(message.url), 'url should not contain multiple consecutive "/" characters');
      return true
    });
  });
  result.onMessage = function (fn) {
    messageHandlers.push(fn);
    return result;
  };
  return result;
}
