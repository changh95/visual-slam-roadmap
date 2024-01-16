# JSONLines for Node.js

Parse [JSONLines](http://jsonlines.org) with Node.js.

## Installation

```sh
npm install --save jsonlines
```

## Usage

```javascript
var jsonlines = require('jsonlines')
var parser = jsonlines.parse()

parser.on('data', function (data) {
  console.log('Got json:', data)
})

parser.on('end', function () {
  console.log('No more data')
})

parser.write('{ "test": "This is a test!" }\n')
parser.write('{ "jsonlines": "is awesome" }')
parser.end()
```

```javascript
var jsonlines = require('jsonlines')
var stringifier = jsonlines.stringify()

stringifier.pipe(process.stdout)

stringifier.write({ test: 'This is a test!' })
stringifier.write({ jsonlines: 'is awesome' })
stringifier.end()
```

## API

### `.parse([options])`

Returns a transform stream that turns newline separated json into a stream of
javascript values.

`options` is an optional object with the keys documented below.

### `.stringify()`

Returns a transform stream that turns javascript values into a stream of newline
separated json.

## Options

### `emitInvalidLine`

If true, instead of emitting an error and cancelling the stream when an invalid line is proccessed, an `invalid-line` event is emitted with the same error. This is very useful when processing text that have mixed plain text and json data.

Example:

```js
var jsonlines = require('jsonlines')
var parser = jsonlines.parse({ emitInvalidLines: true })

parser.on('data', function (data) {
  console.log('Got json:', data)
})

parser.on('invalid-line', function (err) {
  console.log('Got text:', err.source)
})

parser.write('{ "test": "This is a test!" }\n')
parser.write('This is some plain text\n')
parser.write('{ "jsonlines": "is awesome" }')
parser.end()
```

Output:

```text
Got json: { test: 'This is a test!' }
Got text: This is some plain text
Got json: { jsonlines: 'is awesome' }
```
