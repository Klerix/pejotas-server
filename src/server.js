var pkg = require('../package.json')
var restify = require('restify')

// init server
var server = restify.createServer({
  name: pkg.name,
  version: pkg.version
})

// "use" directives
server.use(restify.queryParser())
server.use(restify.gzipResponse())
server.use(restify.CORS())

// "pre" directives
server.pre(restify.pre.sanitizePath())

module.exports = server
