var Transform = require('stream').Transform

function Stringifier () {
  if (!(this instanceof Stringifier)) {
    throw new TypeError('Cannot call a class as a function')
  }

  Transform.call(this, { objectMode: true })
}

Stringifier.prototype = Object.create(Transform.prototype)

Stringifier.prototype._transform = function (data, _, cb) {
  var value

  try {
    value = JSON.stringify(data)
  } catch (err) {
    err.source = data
    return cb(err)
  }

  cb(null, value + '\n')
}

module.exports = Stringifier
