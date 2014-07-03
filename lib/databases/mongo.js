'use strict';

var assert = require('assert');
var mongod = require('mongod');
var assertions = require('../assertions.js');

module.exports = MongoDatabase;
function MongoDatabase(db) {
  this.db = mongod(db, ['messages', 'topics', 'processed']);
}
MongoDatabase.prototype.processed = function (url) {
  assert(typeof url === 'string', 'The url must be a string.');
  assert(/^http/.test(url), 'The url must start with http');
  return this.db.processed.find({_id: url}).count().then(function (count) {
    return count !== 0;
  }, function () {
    return false;
  });
};
MongoDatabase.prototype.markProcessed = function (url) {
  assert(typeof url === 'string', 'The url must be a string.');
  assert(/^http/.test(url), 'The url must start with http');
  return this.db.processed.update({_id: url}, {_id: url}, {upsert: true});
};

MongoDatabase.prototype.addMessage = function (message) {
  assertions.isMessage(message);
  return this.db.messages.update({_id: message._id}, message, {upsert: true});
};

MongoDatabase.prototype.getMessages = function (subjectToken) {
  return this.db.messages.find({subjectToken: subjectToken});
};

MongoDatabase.prototype.updateSubject = function generateSubject(subject) {
  assertions.isSubject(subject);
  return this.db.topics.update({_id: subject._id}, subject, {upsert: true});
};

MongoDatabase.prototype.close = function () {
  this.db.close();
};
