/* eslint-env mocha */

var jsonlines = require('../')

var assert = require('assert')
var concat = require('concat-stream')

describe('Parser', function () {
  it('should handle simple jsonlines', function (done) {
    var parser = jsonlines.parse()
    var expected = [
      { a: 453345, b: 23423 },
      { c: 843222, d: 19534 },
      { e: 656564, f: 76521 }
    ]

    parser.pipe(concat({ encoding: 'object' }, function (result) {
      assert.deepEqual(result, expected)
      done()
    }))

    for (var line of expected) {
      parser.write(JSON.stringify(line) + '\n')
    }

    parser.end()
  })

  it('should handle strange chunks', function (done) {
    var parser = jsonlines.parse()
    var expected = [
      { test: 'This is a test!' },
      { key: 'value' }
    ]

    parser.pipe(concat({ encoding: 'object' }, function (result) {
      assert.deepEqual(result, expected)
      done()
    }))

    parser.write('{ "tes')
    parser.write('t": "This is a test!" ')
    parser.write('}\n{ "key": "value" }')
    parser.write('\n\n\n')

    parser.end()
  })

  it('should ignore empty lines', function (done) {
    var parser = jsonlines.parse()
    var expected = [
      { first: true, last: false },
      { first: false, last: true }
    ]

    parser.pipe(concat({ encoding: 'object' }, function (result) {
      assert.deepEqual(result, expected)
      done()
    }))

    for (var line of expected) {
      parser.write(JSON.stringify(line) + '\n\n\n\n\n')
    }

    parser.end()
  })

  it('should handle plain values', function (done) {
    var parser = jsonlines.parse()
    var expected = [ true, false, true, true, false ]

    parser.pipe(concat({ encoding: 'object' }, function (result) {
      assert.deepEqual(result, expected)
      done()
    }))

    for (var line of expected) {
      parser.write(JSON.stringify(line) + '\n')
    }

    parser.end()
  })

  it('should emit an error on malformed json', function (done) {
    var parser = jsonlines.parse()
    var line = '{ "broken": _ }'

    parser.on('error', function (err) {
      assert.equal(err.source, line)
      done()
    })

    parser.end(line)
  })

  it('should emit invalid lines', function (done) {
    var parser = jsonlines.parse({ emitInvalidLines: true })
    var data = '"works"\nbroken\n"ok"'

    parser.once('data', function (data) {
      assert.equal(data, 'works')

      parser.once('invalid-line', function (err) {
        assert.equal(err.source, 'broken')

        parser.once('data', function (data) {
          assert.equal(data, 'ok')
          done()
        })
      })
    })

    parser.end(data)
  })
})
