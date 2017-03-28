let fs = require('fs')
let path = require('path')
let _ = require('lodash')
let pkg = require('../../package.json')

module.exports = (options) => {
  let tpl = _.template(fs.readFileSync(path.join(__dirname, './template.html')))
  let content = _.template(fs.readFileSync(path.join(__dirname, './controller.html')))

  options.values = [
    {
      label: 'Clase',
      model: 'classes',
      relations: ['events', 'skills', 'traits']
    },
    {
      label: 'Eventos',
      model: 'events',
      relations: ['classes']
    },
    {
      label: 'Habilidades',
      model: 'skills',
      relations: ['classes']
    },
    {
      label: 'Rasgos',
      model: 'traits',
      relations: ['classes']
    },
    {
      label: 'Palabras Especiales',
      model: 'words',
      relations: []
    }
  ]

  return tpl({
    version: pkg.version,
    content: content(options)
  })
}
