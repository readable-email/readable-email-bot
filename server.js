'use strict';

var connect = require('readable-lists-api');
var ms = require('ms');
var run = require('./lib/run-bot.js');

var readers = {};
readers.pipermail = require('./lib/readers/pipermail');
readers.w3c = require('./lib/readers/w3c');
readers.w3 = require('./lib/readers/w3c'); // currently these can be read by the same adapter, this may change in the future

var db = connect(process.env.DATABASE, process.env.BUCKET);

var log = [];
var lastStart;

for (var i = 0; i < 50; i++) {
  log.push('');
}
function time() {
  return (new Date()).toISOString();
}
function onList(list) {
  log.shift();
  log.push(time() + ' ' + list.source);
}
function onError(err) {
  log.shift();
  log.push(time() + ' ' + ((err.stack || err) + '').replace(/\n/g, "\n                         "));
  console.error(err.stack || err);
}
function runBot() {
  lastStart = time();
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

var http = require('http')

http.createServer(function (req, res) {
  var status = 200;
  if (Date.now() - (new Date(lastStart)).getTime() > ms('60 minutes')) {
    status = 503
    onError('Timeout triggering restart');
    setTimeout(function () {
      // allow time for the error to be logged
      process.exit(1);
    }, 500);
  }
  res.writeHead(status, {'Content-Type': 'text/plain'})
  var warning = status === 503 ? 'WARNING: server behind on processing\n\n' : ''
  res.end(warning +
          'last-start:   ' + lastStart + '\n' +
          'current-time: ' + (new Date()).toISOString() + '\n\nLogs:\n\n' + log.filter(Boolean).join('\n'));
}).listen(process.env.PORT || 3000);

console.log('Server running at http://localhost:' + (process.env.PORT || 3000));
