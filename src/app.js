var db = require('./servers/database');
var server = require('./servers/restify');

// transform models to routes
db.models2routes(server, require('./models.json'));

// Start listening
server.listen(8080, function() {
    console.log('%s listening at %s', server.name, server.url);
});
