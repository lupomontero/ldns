var events = require('events');
var dns = require('native-dns');
var _ = require('lodash');
var noop = function () {};


var defaults = {
  port: 53,
  zones: {
    dev: {
      '*': '127.0.0.1'
    },
    docker: {
      '*': '192.168.59.103'
    }
  }
};


var rootAuthorities = [
  'a.root-servers.net',
  'b.root-servers.net',
  'c.root-servers.net',
  'd.root-servers.net',
  'e.root-servers.net',
  'f.root-servers.net',
  'g.root-servers.net',
  'h.root-servers.net',
  'i.root-servers.net',
  'j.root-servers.net',
  'k.root-servers.net',
  'l.root-servers.net',
  'm.root-servers.net'
];


//
// Add root authorities to response. This is only used when no answer could be
// produced by us or the remote lookup.
//
function addRootAuthorities(resp) {
  rootAuthorities.forEach(function (authority) {
    resp.authority.push(dns.NS({
      name: '',
      data: authority + '.',
      ttl: 518400
    }));
  });
}


//
// Lookup question using external server.
//
function lookup(q, cb) {
  var req = dns.Request({
    question: q,
    server: { address: '8.8.8.8', port: 53, type: 'udp' },
    timeout: 1000,
  });

  function done(err, data) {
    cb(err, data);
    cb = function () {};
  }

  req.on('timeout', function () {
    done(new Error('Timeout in making request'));
  });

  req.on('message', done);

  req.send();
}


module.exports = function (options) {

  var config = _.extend({}, defaults, options);
  var server = dns.createServer();
  var ldns = new events.EventEmitter();

  ldns.serve = function (cb) {
    cb = cb || noop;
    server.serve(config.port, function () {
      ldns.emit('listening', config);
      cb();
    });
  };

  server.on('request', function (req, resp) {
    var q = req.question[0];
    var type = dns.consts.QTYPE_TO_NAME[q.type];
    var parts = q.name.split('.');
    var tld = parts.pop();
    var subdomain = parts.join('.');
    var zone = config.zones[tld] || {};
    var records = zone[subdomain] || zone['*'];

    if (records && !_.isArray(records)) { records = [ records ]; }

    if (records && records.length) {
      resp.authority.push(dns.NS({
        name: tld,
        data: 'localhost.',
        ttl: 86400
      }));
      resp.additional.push(dns.A({
        name: 'localhost',
        address: '127.0.0.1',
        ttl: 86400
      }));
      records.forEach(function (record) {
        resp.answer.push(dns.A({
          name: q.name,
          address: record,
          ttl: 600
        }));
      });
      ldns.emit('request', req, resp);
      return resp.send();
    }

    lookup(q, function (err, data) {
      if (err) {
        ldns.emit('error', err);
        return resp.send();
      }

      resp.answer = data.answer;
      resp.authority = data.authority;
      resp.additional = data.additional;

      if (!resp.answer.length && !resp.authority.length && !resp.additional.length) {
        addRootAuthorities(resp);
      }

      ldns.emit('request', req, resp);
      resp.send();
    });
  });

  server.on('socketError', function (err, socket) {
    ldns.emit('socketError', err, socket);
  });

  server.on('error', function (err, buff, req, res) {
    ldns.emit('error', err, buff, req, res);
  });


  return ldns;

};

