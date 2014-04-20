'use strict';

var test = require('testit');

var writeMongo = require('../lib/write-mongo');

test('write mongo', function () {
  function insertMessage() {
  }
  var stream = writeMongo({
    messages: { insert: insertMessage },
    topics: {}
  }, {});
  stream.write({
    url: "http://example.com/message.html",
    header: {
      from: { email: "baz@example.com", name:"Tom Smith" },
      date: "2006-02-24T01:35:00.000Z",
      subject: "Welcome to my mailing list"
    },
    body: "It's a great mailing list isn't it."
  });
});
