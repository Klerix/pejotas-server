var mysql = require('mysql');
var showdown = require('showdown');
var converter = new showdown.Converter();
var config = require('../config.json');

// Config DB
var db = {
    models: {},
    server: null,

    pool: mysql.createPool({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
        charset: 'utf8mb4_unicode_ci'
    }),

    queryFormat: function(query, values) {
        if (!values) return query;
        return query.replace(/\:(\w+)/g, function(txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this));
    },

    models2routes: function(server, models) {
        db.server = server;
        db.models = models;

        for (var i in models) {
            var model = new Model(i, models[i]);
            model.enroute();
        }
    },

    query: function(key, query, values, cb) {
        var response = {};

        console.log(query);

        db.pool.getConnection(function(err, connection) {

            // throw error
            if (err) {
                console.log(err);
                return cb(err, cb);
            }

            // Map values
            connection.config.queryFormat = db.queryFormat;

            // Execute query
            connection.query(query, values, function(err, rows) {
                // send response
                if (err) {
                    console.log(err);
                    response = err;
                } else if (rows.length > 1) {
                    response = rows;
                } else if (rows.length == 1) {
                    response = rows[0];
                } else {
                    response = [];
                }

                // And done with the connection.
                connection.release();

                cb(key, response);
            });
        });
    },

    getTableName: function() {
        return [].slice.call(arguments).sort().join("_");
    }
};

/**
 * This class will build queries based on objects
 * @param {object} data Item containing model configuration
 * @param {string} data.table Name of the table.
 * @param {array(string|Model)} [data.has=false] Defines a 1 to N relationship with the specified model.
 * @param {array(string|Model)} [data.belongsTo=false] Defines a N to 1 relationship with the specified model.
 * @param {array(string|Model)} [data.hasAndBelongsTo=false] Defines a ternary relationship with a junction table.
 */
var Model = function(name, data) {
    this.data = data;
    this.name = name;

    this.baseRoute = '/' + data.table;
    this.responses = {};

    this.enroute = function() {
        this._enrouteList();
        this._enrouteRead();
    };

    this.hasRelations = function() {
        return (this.data.hasAndBelongsTo || this.data.has || this.data.belongsTo);
    };

    this._enrouteList = function() {
        var route = this.baseRoute + '/';
        console.log("Routing " + route);

        var context = this;
        db.server.get(route, function(req, res, next) {
            db.query(route, context.buildSelect(), req.params, function(key, response) {
                res.send(context.process(response));
            });
        });
    };

    this._enrouteRead = function() {
        var route = this.baseRoute + '/:id';
        console.log("Routing " + route);

        var context = this;
        db.server.get(route, function(req, res, next) {
            db.query(route, context.buildSelect({ where: "id=:id" }), req.params, function(key, response) {
                if (context.hasRelations()) {
                    context._fetchRelations(res, context.process(response));
                } else {
                    res.send(context.process(response));
                }
            });
        });
    };

    this._fetchRelations = function(res, item) {
        var queue = new Queue(res, item);

        for (var i in this.data.hasAndBelongsTo) {
            //create model
            var model = Model.getModel(this.data.hasAndBelongsTo[i]);

            // get the junction table name
            var junctionTable = db.getTableName(this.data.table, model.data.table);

            // Build query
            model.data.from = junctionTable + ' junction LEFT JOIN ' + model.data.table + ' origin ON (origin.id = junction.' + model.name + '_id)';
            model.data.where = this.name + '_id=:id';

            // enqueue request
            model.enqueueRequest(model.data.table, queue, { id: item.id });
        }

        for (var i in this.data.belongsTo) {
            var model = Model.getModel(this.data.belongsTo[i]);

            //get foreign key
            var field = this.name + "_id";
            if (item[field]) { //field exists and is not 0

                // Build query
                model.data.where = 'id=' + item[field];

                // enqueue request
                model.enqueueRequest(model.name, queue, { id: item.id });
            }
        }

        // If no relation is fetched, trigger queue end
        queue.remove();
    };

    this.enqueueRequest = function(k, queue, values) {
        queue.add(k);
        var context = this;
        db.query(
            k,
            this.buildSelect(),
            values,
            function(key, response) {
                if (!(response instanceof Array)) { response = [response]; }
                queue.remove(key, context.process(response));
            }
        );
    };

    this.buildSelect = function(options) {
        options = options || {};
        var select = 'SELECT origin.*';

        select += this._buildFields(options.fields);
        select += this._buildFrom(options.from);
        select += this._buildWhere(options.where);
        select += this._buildOrderBy(options.orderBy);
        select += this._buildLimit(options.limit);

        return select;
    };

    this._buildFields = function(alt) {
        var value = alt || this.data.fields;
        return (value) ? "," + value : "";
    };

    this._buildFrom = function(alt) {
        var value = alt || this.data.from;
        return value ? " FROM " + value : " FROM " + this.data.table + " origin";
    };

    this._buildWhere = function(alt) {
        var value = false;
        if (alt && this.data.where) {
            value = alt + " AND " + this.data.where;
        } else {
            value = alt || this.data.where;
        }

        return value ? " WHERE " + value : "";
    };

    this._buildOrderBy = function(alt) {
        var value = alt || this.data.orderBy;
        return value ? " ORDER BY " + value : "";
    };

    this._buildLimit = function(alt) {
        var value = alt || this.data.limit;
        return value ? " LIMIT " + value : "";
    };

    this.process = function(item) {
        if (item instanceof Array) {
            for (var i in item) {
                item[i] = this.process(item[i]);
            }
        } else {
            // Convert markdown to html
            for (var j in this.data.md2html) {
                var field = this.data.md2html[j];
                item[field] = converter.makeHtml(item[field]);
            }
        }

        return item;
    };
};

Model.getModel = function(data) {
    // Accept either string or object
    if (typeof data == "string") data = { name: data };

    // Get data from info
    var base = db.models[data.name];
    for (var i in base) {
        if (typeof data[i] == "undefined") {
            data[i] = base[i];
        }
    }

    // Create model
    return new Model(data.name, data);
};

var Queue = function(res, item) {
    this.res = res;
    this.item = item;
    this.queue = [];

    this.add = function(key) {
        this.queue.push(key);
    };

    this.remove = function(key, response) {
        //save response
        if (response) {
            this.item[key] = response;
        }

        // remove from queue
        var index = this.queue.indexOf(key);
        if (index != -1) this.queue.splice(index, 1);

        // if queue is empty, proceed to send the info
        if (this.queue.length == 0) {
            this.res.send(this.item);
        }
    }
}

module.exports = db;
