'use strict';

var assert = require('assert');
var Promise = require('promise');
var throat = require('throat');
var slug = require('slugg');

module.exports = runBot;
function runBot(source, database) {
  var updateSubject = throat(1, function (subjectToken) {
    return database.getMessageHeaders(subjectToken).then(function (messages) {
      assert(messages.length > 0 && typeof messages.length === 'number');
      messages = messages.sort(function (a, b) {
        return a.date.getTime() - b.date.getTime();
      });
      var first = messages[0];
      var last = messages[messages.length - 1];
      assert(first.date.getTime() <= last.date.getTime());

      return database.updateSubject({
        _id: source.url + '#' + slug(first.subject),
        subjectToken: subjectToken,
        source: source.url,
        subject: first.subject,
        messages: messages.length,
        first: first.from,
        last: last.from,
        start: first.date,
        end: last.date
      });
    });
  });
  function processMessage(url) {
    return database.processed(url).then(function (exists) {
      if (exists) return;
      return source.getMessage(url).then(function (message) {
        //filter spam
        if (/spam/i.test(message.subject) || /no subject/i.test(message.subject)) {
          return;
        }

        if (message.subject.substr(0, source.id.length + 3).toLowerCase() === '[' + source.id + '] ') {
          message.subject = message.subject.substr(source.id.length + 3);
        }

        var subjectToken = getSubjectToken(source.url, message.subject);
        return database.addMessage({
          _id: message.url,
          reply: message.reply,
          subjectToken: subjectToken,
          source: source.url,
          subject: message.subject,
          from: message.from,
          date: message.date,
          body: message.body
        }).then(function () {
          return updateSubject(subjectToken);
        }).then(function () {
          return database.markProcessed(url);
        });
      });
    });
  }
  return source.getMessages().then(function (urls) {
    return new Promise(function (resolve, reject) {
      urls = urls.slice().reverse();
      var errors = [];
      function next() {
        if (urls.length === 0) {
          return errors.length === 0 ? resolve() : reject(new Error(errors.join('\n')));
        } else {
          processMessage(urls.pop()).done(function () {
            next();
          }, function (err) {
            errors.push((err && err.message ? err.message : err) + '');
            next();
          });
        }
      }
      next();
    });
  });
}


function getSubjectToken(source, subject) {
  return source + '#' + subject.replace(/[^a-z0-9]+/gi, '')
                .replace(/fwd?/gi, '')
                .replace(/re/gi, '')
                .toLowerCase();
}
