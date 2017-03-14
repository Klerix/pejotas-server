let view = require('./views/controller')
let _ = require('lodash')
let error = require('./error')

class Controller {
  constructor (endpoint, server, db) {
    this.db = db
    this.endpoint = endpoint

    this.enroute(endpoint, server)
  }

  enroute (endpoint, server) {
    server.get(`/${endpoint}`, this.index.bind(this))
    server.get(`/${endpoint}/archetypes`, this.listArchtypes.bind(this))
    server.get(`/${endpoint}/archetypes/:id`, this.viewArchtype.bind(this))
  //   server.get(`/${endpoint}/classes`, this.listClasses.bind(this))
  //   server.get(`/${endpoint}/classes/:id`, this.viewClass.bind(this))
  //   server.get(`/${endpoint}/events`, this.listEvents.bind(this))
  //   server.get(`/${endpoint}/events/:id`, this.viewEvent.bind(this))
  //   server.get(`/${endpoint}/skills`, this.listSkills.bind(this))
  //   server.get(`/${endpoint}/skills/:id`, this.viewSkill.bind(this))
  //   server.get(`/${endpoint}/traits`, this.listTraits.bind(this))
  //   server.get(`/${endpoint}/traits/:id`, this.viewTrait.bind(this))
  //   server.get(`/${endpoint}/words`, this.listWords.bind(this))
  }

  index (req, res, next) {
    let body = view({ controller: this })
    res.writeHead(200, {
      'Content-Type': 'text/html'
    })
    res.write(body)
    res.end()
    return next()
  }

  list (origin, req, res, next) {
    this.db.all('SELECT * FROM ' + origin + ' ORDER BY name', (err, rows) => {
      if (err) error(err, res)
      res.send(rows)
      return next()
    })
  }

  view (origin, req, res, next, relations) {
    this.db.get('SELECT * FROM ' + origin + ' WHERE id=?', [req.params.id], (err, result) => {
      if (err) return error(err, res)

      // relations
      this.db.serialize(() => {
        let count = relations.length
        relations.forEach((rel) => {
          _.assignIn(rel, { fields: 'dest.*' })
          let sql = 'SELECT ' + rel.fields + ' FROM ' + rel.ternary + ' tern ' +
            'LEFT JOIN ' + rel.dest + ' dest ON (dest.id = tern.' + rel.key + ') ' +
            'WHERE ' + rel.key + '=? '
          if (rel.orderby) sql += 'ORDER BY ' + rel.orderby

          this.db.all(sql, [req.params.id], (err, rows) => {
            if (err) return error(err, res)

            result[rel.dest] = rows
            count--
            if (count === 0) {
              res.send(result)
              return next()
            }
          })
        })
      })
    })
  }

  listArchtypes (req, res, next) {
    this.list('archetypes', req, res, next)
  }

  viewArchtype (req, res, next) {
    this.view('archetypes', req, res, next, [
      { dest: 'events', ternary: 'archetypes_events', key: 'archetype_id' },
      { dest: 'traits', ternary: 'archetypes_traits', key: 'archetype_id' }
    ])
  }
}

module.exports = Controller
