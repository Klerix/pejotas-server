var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var pkg = require('../../package.json')

module.exports = (options) => {
  var tpl = _.template(fs.readFileSync(path.join(__dirname, './template.html')))
  var content = _.template(fs.readFileSync(path.join(__dirname, './index.html')))

  return tpl({
    version: pkg.version,
    content: content(options)
  })
}
