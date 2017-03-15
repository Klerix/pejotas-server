let fs = require('fs')
let path = require('path')
let _ = require('lodash')
let pkg = require('../../package.json')

module.exports = (options) => {
  let tpl = _.template(fs.readFileSync(path.join(__dirname, './template.html')))
  let content = _.template(fs.readFileSync(path.join(__dirname, './index.html')))

  return tpl({
    version: pkg.version,
    content: content(options)
  })
}
