'use strict';

var assert = require('assert');
var test = require('testit');
var Promise = require('promise');

var writeMongo = require('../lib/write-mongo');

test('write mongo', function () {
  var onWrittenMessage;
  var writtenMessage = new Promise(function (resolve) {
    onWrittenMessage = resolve;
  });
  function insertMessage(message, options) {
    assert.deepEqual(options, {safe: true}, 'Message is inserted with `safe` set to `true`.');
    message.date = message.date.toISOString();
    assert.deepEqual(message, {
      _id: "http://example.com/message.html",
      subjectID: "welcometomymailinglist",
      subject: "FWD: Welcome to my mailing list",
      from: { email: "baz@example.com", name:"Tom Smith" },
      date: "2006-02-24T01:35:00.000Z",
      body: "It's a great mailing list isn't it."
    });
    onWrittenMessage();
    return Promise.from(null);
  }
  function aggregateMessage(match, sort, group) {
    assert.deepEqual(match, { '$match': { 'subjectID': "welcometomymailinglist" } });
    assert.deepEqual(sort, { '$sort': { date: 1 } });
    assert.deepEqual(group, {
      '$group': {
        _id: "$subjectID",
        subject: { '$first': '$subject'},
        messages: {'$sum': 1},
        first: { '$first': '$from' },
        last: { '$last': '$from' },
        start: { '$first': '$date' },
        end: { '$last': '$date' }
      }
    });
    return Promise.from([{
      _id: 'welcometomymailinglist',
      subject: 'Welcome to my mailing list',
      messages: 2,
      first: {email: 'baz@example.com', name: 'Tom Smith'},
      last: {email: 'bar@example.com', name: 'John Smith'},
      start: new Date('2000-02-03T01:00:00.000Z'),
      end: new Date('2000-02-03T02:00:00.000Z')
    }]);
  }
  function updateTopics(query, update, options) {
    assert.deepEqual(query, {_id: 'welcome-to-my-mailing-list'});
    assert.deepEqual(update, {
      _id: 'welcome-to-my-mailing-list',
      subjectID: 'welcometomymailinglist',
      subject: 'Welcome to my mailing list',
      messages: 2,
      first: {email: 'baz@example.com', name: 'Tom Smith'},
      last: {email: 'bar@example.com', name: 'John Smith'},
      start: new Date('2000-02-03T01:00:00.000Z'),
      end: new Date('2000-02-03T02:00:00.000Z')
    });
    assert.deepEqual(options, {upsert: true}, 'use upsert to update topic');
  }
  var stream = writeMongo({
    messages: { insert: insertMessage, aggregate: aggregateMessage },
    topics: { update: updateTopics }
  }, {});
  stream.write({
    url: "http://example.com/message.html",
    header: {
      from: { email: "baz@example.com", name:"Tom Smith" },
      date: "2006-02-24T01:35:00.000Z",
      subject: "FWD: Welcome to my mailing list"
    },
    body: "It's a great mailing list isn't it."
  });
  return writtenMessage;
});
