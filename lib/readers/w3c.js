'use strict';

var assert = require('assert');
var Promise = require('promise');
var request = require('then-request');
var ent = require('ent');

function get(url, attempts) {
  attempts = attempts || 10;
  return request(url).then(function (res) {
    return res.getBody().toString();
  }).then(null, function (err) {
    if (attempts < 2) throw err;
    console.error(err.stack || err);
    return get(url, attempts - 1);
  });
}

function readIndex(url) {
  return get(url).then(function (body) {
    var pattern = /href=\"(\d\d\d\d[A-Z][a-z]+\/)\"/gi
    var match
    var urls = []
    while (match = pattern.exec(body)) {
      urls.push(url + match[1])
    }
    return urls.reverse()
  });
}
function readMonth(url) {
  return get(url).then(function (body) {
    var pattern = /href=\"(\d+\.html)\"/gi
    var match
    var dedupe = {}
    var urls = []
    while (match = pattern.exec(body)) {
      var u = url + match[1]
      if (!dedupe[u]) {
        urls.push(u)
        dedupe[u] = u
      }
    }
    return urls
  });
}
function readMessage(url) {
  return get(url).then(function (body) {
    var reply = null, subject = null, date = null, from = null, messageBody = null;
    body.replace(/\<a href\=\"([^\"]*)\" [^\>]*\>Respond\<\/a\>/g, function (_, rep) {
      assert(reply === null, 'Message should have only one reply to address');
      reply = ent.decode(rep);
    });
    assert(reply !== null, 'Message should have a reply to address');
    body.replace(/\<h1\>(.*)\<\/h1\>/g, function (_, sub) {
      assert(subject === null, 'Message should have only one subject');
      subject = ent.decode(sub);
    });
    assert(subject !== null, 'Message should have a subject');
    body.replace(/\<span id\=\"from\"\>\n\<dfn\>From\<\/dfn\>: (.*) \&lt\;\<a href\=\"[^\"]*\">(.*)\<\/a\>\&gt\;\n\<\/span\>/g, function (_, name, email) {
      assert(from === null, 'Message should have only one from');
      from = {
        name: ent.decode(name),
        email: ent.decode(email)
      };
    });
    assert(from !== null, 'Message should have a from');
    body.replace(/\<span id\=\"date\"\>\<dfn\>Date\<\/dfn\>\: (.*)\<\/span\>/g, function (_, dat) {
      assert(date === null, 'Message should have only one date');
      date = ent.decode(dat);
    });
    assert(date !== null, 'Message should have a date');
    body.replace(/\<pre id\=\"body\"\>\n<a[^\>]*\>\<\/a\>((?:\n|\r|.)*)\<\/pre\>/g, function (_, bod) {
      assert(messageBody === null, 'Message should have only one body');
      messageBody = ent.decode(bod);
    });
    assert(messageBody !== null, 'Message should have a body');
    return {
      url: url,
      reply: reply,
      subject: subject,
      from: from,
      date: new Date(date),
      body: messageBody
    };
  });
}

module.exports = W3C;
module.exports.get = get;
function W3C(id, url, options) {
  this.id = id;
  assert(url === url.replace(/([^\/])\/?$/g, '$1/'));
  this.url = url;
  this.options = options;
}
W3C.prototype.getMessages = function () {
  return readIndex(this.url).then(function (months) {
    return Promise.all(months.reverse().map(function (month) {
      return readMonth(month);
    }));
  }).then(function (messages) {
    return messages.reduce(function (a, b) {
      return a.concat(b.reverse());
    }, []);
  });
};
W3C.prototype.getMessage = function (url) {
  assert(url.substr(0, this.url.length) === this.url);
  return readMessage(url);
};
