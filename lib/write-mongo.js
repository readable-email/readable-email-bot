'use strict';

var Promise = require('promise');
var Transform = require('barrage').Transform;
var slug = require('slugg');

module.exports = outputToMongo;
function outputToMongo(database, source) {
  var stream = new Transform({objectMode: true});
  stream._transform = function (message, _, callback) {
    var header = message.header;
    header._id = message.url;
    header.subjectID = message.subjectID;
    var body = {
      _id: message.url,
      subjectID: message.subjectID,
      content: message.body
    };
    Promise.all([
      db.headers.insert(header, {safe: true}),
      db.contents.insert(body, {safe: true})
    ]).then(function () {
      return updateSubject(database, source, message.subjectID);
    }).then(function () {
      stream.push(message);
    }).nodeify(callback);
  };
  return stream
}

function updateSubject(database, source, subjectID) {
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