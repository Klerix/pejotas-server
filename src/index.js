require('dotenv').config()

var server = require('./server')

global.dev = (process.env.NODE_ENV === 'development')
global.port = process.env.PORT || 8080
global.baseurl = global.dev ? `http://localhost:${global.port}/` : 'http://pejotas.klerix.com/api/'

// router
require('./router')(server)

// Start listening
server.listen(global.port, () => {
  console.log(`${server.name} listening at ${server.url}`)
})
