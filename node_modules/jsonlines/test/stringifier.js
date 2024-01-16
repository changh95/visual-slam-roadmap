/* eslint-env mocha */

var jsonlines = require('../')

var assert = require('assert')
var concat = require('concat-stream')

describe('Stringifier', function () {
  it('should handle simple jsonlines', function (done) {
    var stringifier = jsonlines.stringify()
    var source = [
      { a: 453345, b: 23423 },
      { c: 843222, d: 19534 },
      { e: 656564, f: 76521 }
    ]
    var expected = source.map(function (obj) {
      return JSON.stringify(obj)
    }).join('\n')

    stringifier.pipe(concat({ encoding: 'buffer' }, function (result) {
      assert.deepEqual(result.toString().trim(), expected)
      done()
    }))

    for (var line of source) {
      stringifier.write(line)
    }

    stringifier.end()
  })

  it('should handle plain values', function (done) {
    var stringifier = jsonlines.stringify()
    var source = [ true, false, true, true, false ]
    var expected = 'true\nfalse\ntrue\ntrue\nfalse'

    stringifier.pipe(concat({ encoding: 'buffer' }, function (result) {
      assert.deepEqual(result.toString().trim(), expected)
      done()
    }))

    for (var line of source) {
      stringifier.write(line)
    }

    stringifier.end()
  })

  it('should emit an error on bad values', function (done) {
    var stringifier = jsonlines.stringify()
    var broken = { a: 1 }

    // Make the value bad
    broken.self = broken

    stringifier.on('error', function (err) {
      assert.equal(err.source, broken)
      done()
    })

    stringifier.end(broken)
  })
})
