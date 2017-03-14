var server = require('./server')

// router
require('./router')(server)

// Start listening
server.listen(8080, () => {
  console.log(`${server.name} listening at ${server.url}`)
})
