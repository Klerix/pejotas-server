var package = require('../package.json');
var restify = require('restify');

// init server
var server = restify.createServer({
    name: package.name,
    version: package.version
});

// "use" directives
server.use(restify.queryParser());
server.use(restify.gzipResponse());
server.use(restify.CORS());

// "pre" directives
server.pre(restify.pre.sanitizePath());

module.exports = server;
