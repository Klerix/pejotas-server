let fs = require('fs')
let path = require('path')
let _ = require('lodash')
let pkg = require('../../package.json')

module.exports = (options) => {
  let tpl = _.template(fs.readFileSync(path.join(__dirname, './template.html')))
  let content = _.template(fs.readFileSync(path.join(__dirname, './controller.html')))

  options.values = [
    {
      label: 'Arquetipo',
      model: 'archetypes',
      relations: ['events', 'traits']
    },
    {
      label: 'Clase',
      model: 'classes',
      relations: ['events', 'skills']
    },
    {
      label: 'Eventos',
      model: 'events',
      relations: ['archetypes', 'classes']
    },
    {
      label: 'Habilidades',
      model: 'skills',
      relations: ['classes']
    },
    {
      label: 'Rasgos',
      model: 'traits',
      relations: ['archetypes']
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
