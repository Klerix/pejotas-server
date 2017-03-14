var Controller = require('./controller')
var sqlite = require('sqlite3').verbose()
var view = require('./views/index')

module.exports = function (server) {
  var router = {
    klerix: new Controller('klerix', server,
      new sqlite.Database('./data/klerix.sqlite', sqlite.OPEN_READONLY))
  }

  server.get('/', (req, res, next) => {
    var body = view({ router })
    res.writeHead(200, {
      'Content-Type': 'text/html'
    })
    res.write(body)
    res.end()
    return next()
  })

  process.on('SIGINT', () => {
    console.log('Shuting down...')
    for (var key in router) {
      router[key].db.close()
    }
    server.close()
  })

  return router
}
