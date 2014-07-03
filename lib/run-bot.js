'use strict';

var assert = require('assert');
var Promise = require('promise');
var throat = require('throat');
var slug = require('slugg');

module.exports = runBot;
function runBot(source, database) {
  function processMessage(url) {
    return database.processed(url).then(function (exists) {
      if (exists) return;
      console.dir(url);
      return source.getMessage(url).then(function (message) {
        //filter spam
        if (/spam/i.test(message.subject) || /no subject/i.test(message.subject)) {
          return;
        }

        var subjectToken = getSubjectToken(source.url, message.subject);
        return database.addMessage({
          _id: message.url,
          subjectToken: subjectToken,
          source: source.url,
          subject: message.subject,
          from: message.from,
          date: message.date,
          body: message.body
        }).then(function () {
          return database.getMessages(subjectToken);
        }).then(function (messages) {
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
        }).then(function () {
          return database.markProcessed(url);
        });
      });
    });
  }
  return source.getMessages().then(function (urls) {
    console.log('messages ' + urls.length);
    return Promise.all(urls.map(throat(1, processMessage)));
  });
}


function getSubjectToken(source, subject) {
  return source + '#' + subject.replace(/[^a-z0-9]+/gi, '')
                .replace(/fwd?/gi, '')
                .replace(/re/gi, '')
                .toLowerCase();
}
