'use strict';

var Promise = require('promise');
var Transform = require('barrage').Transform;
var slug = require('slugg');

module.exports = outputToMongo;
function outputToMongo(database, source) {
  var stream = new Transform({objectMode: true});
  stream._transform = function (message, _, callback) {
    var dbMessage = {
      _id: message.url,
      subjectID: tag(message.header.subject),
      subject: message.header.subject,
      from: { email: message.header.from.email, name: message.header.from.name },
      date: (new Date(message.header.date)).toISOString(),
      body: message.body
    };
    db.messages.insert(dbMessage, {safe: true}).then(function () {
      return updateSubject(database, source, message);
    }).then(function () {
      stream.push(message);
    }).nodeify(callback);
  };
  return stream;
}

function tag(subject) {
  return subject.replace(/[^a-z0-9]+/gi, '')
                .replace(/fwd?/gi, '')
                .replace(/re/gi, '')
                .toLowerCase();
}

function updateSubject(database, source, message) {
  var sort = { '$sort': { date: 1 } };
  var group = {
    '$group': {
      _id: "$subjectID",
      subject: { '$first': '$subject'},
      messages: {'$sum': 1},
      first: { '$first': '$from' },
      last: { '$last': '$from' },
      start: { '$first': '$date' },
      end: { '$last': '$date' }
    }
  };
  var match = { '$match': { 'subjectID': subjectID } };
  return db.headers.aggregate(match, sort, group).then(function (topics) {
    assert(topics.length === 1, 'There should be exactly one topic to update');
    var topic = topics[0];
    topic.subjectID = topic._id;
    topic._id = slug(topic.subject);
    return db.topics.update({_id: topic._id}, topic, {upsert: true});
  });
}