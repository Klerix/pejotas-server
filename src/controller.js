let view = require('./views/controller')
let _ = require('lodash')
let error = require('./error')

class Controller {
  constructor(endpoint, server, db) {
    this.db = db
    this.endpoint = endpoint

    this.enroute(endpoint, server)
  }

  enroute(endpoint, server) {
    server.get(`/${endpoint}`, this.index.bind(this))

    server.get(`/${endpoint}/classes`, this.listClasses.bind(this))
    server.get(`/${endpoint}/classes/:id`, this.viewClass.bind(this))
    server.get(`/${endpoint}/classes/:id/events`, this.relClassesEvents.bind(this))
    server.get(`/${endpoint}/classes/:id/skills`, this.relClassesSkills.bind(this))
    server.get(`/${endpoint}/classes/:id/traits`, this.relClassesTraits.bind(this))

    server.get(`/${endpoint}/events`, this.listEvents.bind(this))
    server.get(`/${endpoint}/events/:id`, this.viewEvent.bind(this))
    server.get(`/${endpoint}/events/:id/classes`, this.relEventsClasses.bind(this))

    server.get(`/${endpoint}/skills`, this.listSkills.bind(this))
    server.get(`/${endpoint}/skills/:id`, this.viewSkill.bind(this))
    server.get(`/${endpoint}/skills/:id/classes`, this.relSkillsClasses.bind(this))

    server.get(`/${endpoint}/traits`, this.listTraits.bind(this))
    server.get(`/${endpoint}/traits/:id`, this.viewTrait.bind(this))
    server.get(`/${endpoint}/traits/:id/classes`, this.relTraitsClasses.bind(this))

    server.get(`/${endpoint}/words`, this.listWords.bind(this))
    server.get(`/${endpoint}/words/:id`, this.viewWords.bind(this))
  }

  index(req, res, next) {
    let body = view({ controller: this })
    res.writeHead(200, {
      'Content-Type': 'text/html'
    })
    res.write(body)
    res.end()
    return next()
  }

  show(origin, req, res, next, options) {
    options = options || {}

    let sql = 'SELECT * FROM ' + origin
    if (options.orderby) sql += ' ORDER BY ' + options.orderby

    let callback = (err, rows) => {
      if (err) return error(err, res)
      res.send(rows)
      return next()
    }

    if (options.where) {
      sql += ' WHERE ' + options.where
      this.db.get(sql, [req.params.id], callback)
    } else {
      this.db.all(sql, callback)
    }
  }

  rel(ternary, dest, origKey, destKey, req, res, next, options) {
    options = _.assign({ fields: 'dest.*', orderby: 'dest.name' }, options)

    let sql = 'SELECT ' + options.fields + ' FROM ' + ternary + ' tern ' +
      'LEFT JOIN ' + dest + ' dest ON (dest.id = tern.' + destKey + ') ' +
      'WHERE ' + origKey + '=? '

    if (options.orderby) sql += 'ORDER BY ' + options.orderby

    this.db.all(sql, [req.params.id], (err, rows) => {
      if (err) return error(err, res)
      res.send(rows)
      return next()
    })
  }

  listClasses(req, res, next) {
    this.show('classes', req, res, next, { orderby: 'type, name' })
  }

  viewClass(req, res, next) {
    this.show('classes', req, res, next, { where: 'id = ?' })
  }

  relClassesEvents(req, res, next) {
    this.rel('classes_events', 'events', 'class_id', 'event_id', req, res, next, {
      orderby: 'name'
    })
  }

  relClassesSkills(req, res, next) {
    this.rel('classes_skills', 'skills', 'class_id', 'skill_id', req, res, next, {
      orderby: 'dest.category, dest.name',
      fields: 'dest.*, tern.extracost + dest.cost as totalcost'
    })
  }

  relClassesTraits(req, res, next) {
    this.rel('classes_traits', 'traits', 'class_id', 'trait_id', req, res, next, {
      orderby: 'dest.category, dest.name'
    })
  }

  listEvents(req, res, next) {
    this.show('events', req, res, next, { orderby: 'name' })
  }

  viewEvent(req, res, next) {
    this.show('events', req, res, next, { where: 'id = ?' })
  }

  relEventsClasses(req, res, next) {
    this.rel('classes_events', 'classes', 'event_id', 'class_id', req, res, next, {
      orderby: 'type, name'
    })
  }

  listSkills(req, res, next) {
    this.show('skills', req, res, next, { orderby: 'category, name' })
  }

  viewSkill(req, res, next) {
    this.show('skills', req, res, next, { where: 'id = ?' })
  }

  relSkillsClasses(req, res, next) {
    this.rel('classes_skills', 'classes', 'skill_id', 'class_id', req, res, next, {
      orderby: 'dest.type, dest.name'
    })
  }

  listTraits(req, res, next) {
    this.show('traits', req, res, next, { orderby: 'name' })
  }

  viewTrait(req, res, next) {
    this.show('traits', req, res, next, { where: 'id = ?' })
  }

  relTraitsClasses(req, res, next) {
    this.rel('classes_traits', 'classes', 'trait_id', 'class_id', req, res, next, {
      orderby: 'dest.type, dest.name'
    })
  }

  listWords(req, res, next) {
    this.show('words', req, res, next, { orderby: 'name' })
  }

  viewWords(req, res, next) {
    this.show('words', req, res, next, { where: 'id = ?' })
  }
}

module.exports = Controller
