#!/usr/bin/env node

var minimist = require('minimist');
var bunyan = require('bunyan');
var pkg = require('../package.json');
var argv = minimist(process.argv.slice(2));


// Show version if asked to do so.
if (argv.v || argv.version) {
  console.log(pkg.version);
  process.exit(0);
}


// Show help if applicable.
if (argv.h || argv.help) {
  console.log([
    '',
    'Usage:',
    '',
    pkg.name + ' [ <options> ... ]',
    '',
    'Options:',
    '',
    '--port           Port to bind on.',
    '-h, --help       Show this help.',
    '-v, --version    Show ' + pkg.name + ' version.',
    ''
  ].join('\n'));
  process.exit(0);
}


var server = require('../')(argv);
var log = bunyan.createLogger({
  name: pkg.name,
  level: argv.debug === true ? 10 : 30
});


server.on('socketError', function (err, socket) {
  log.error(err);
});

server.on('error', function (err, buff, req, res) {
  log.error(err);
});

server.on('listening', function (config) {
  log.info('DNS server listening on port' + config.port);
  log.debug({ config: config });
});

server.on('request', function (req, res) {
  log.debug('request', {
    address: req.address,
    question: req.question,
    answer: res.answer,
    authority: res.authority,
    additional: res.additional
  });
});

server.serve();

