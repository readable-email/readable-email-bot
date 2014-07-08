'use strict';

var connect = require('readable-lists-api');
var run = require('./lib/run-bot.js');

var readers = {};
readers.pipermail = require('./lib/readers/pipermail');
readers.w3c = require('./lib/readers/w3c');

var db = connect(process.argv[2] || process.env.DATABASE);

function onList(list) {
  console.log(list.source);
}
function onError(err) {
  console.error(err.stack || err);
}
function runBot() {
  db.getLists().then(function (lists) {
    function next() {
      if (lists.length === 0) return;
      var list = lists.pop();
      onList(list);
      var source = new readers[list.type](list._id, list.source);
      return run(source, db).then(null, onError).then(next);
    }
    return next();
  }).then(null, onError).done(runBot);
}
runBot();
