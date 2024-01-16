var Transform = require('stream').Transform

function Parser (options) {
  if (!(this instanceof Parser)) {
    throw new TypeError('Cannot call a class as a function')
  }

  options = options || {}

  Transform.call(this, { objectMode: true })
  this._memory = ''
  this._emitInvalidLines = (options.emitInvalidLines || false)
}

Parser.prototype = Object.create(Transform.prototype)

Parser.prototype._handleLines = function (lines, cb) {
  for (var i = 0; i < lines.length; i++) {
    if (lines[i] === '') continue

    var err = null
    var json = null
    try {
      json = JSON.parse(lines[i])
    } catch (_err) {
      _err.source = lines[i]
      err = _err
    }

    if (err) {
      if (this._emitInvalidLines) {
        this.emit('invalid-line', err)
      } else {
        return cb(err)
      }
    } else {
      this.push(json)
    }
  }

  cb(null)
}

Parser.prototype._transform = function (chunk, encoding, cb) {
  var lines = (this._memory + chunk.toString()).split('\n')

  this._memory = lines.pop()
  this._handleLines(lines, cb)
}

Parser.prototype._flush = function (cb) {
  if (!this._memory) return cb(null)

  var line = this._memory

  this._memory = ''
  this._handleLines([ line ], cb)
}

module.exports = Parser
