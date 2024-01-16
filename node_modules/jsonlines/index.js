var Parser = require('./lib/parser')
var Stringifier = require('./lib/stringifier')

exports.parse = function parse (options) {
  return new Parser(options)
}

exports.stringify = function stringify () {
  return new Stringifier()
}
