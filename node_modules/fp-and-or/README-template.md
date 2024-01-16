# fp-and-or
[![npm version](https://img.shields.io/npm/v/fp-and-or.svg)](https://npmjs.org/package/fp-and-or)

Simple `and` and `or` functional programming predicates.

- `and(...fs): (...args): boolean` - Returns a predicate that returns true if **all** arguments are true or evaluate to true for the given input.
- `or(...fs): (...args): boolean` - Returns a predicate that returns true if **at least one** argument is true or evaluates to true for the given input.

A predicate is a function that returns a `boolean`, commonly used in `Array.prototype.filter`.

e.g.

```js
const isEven = n => n%2 === 0
const isPositive = n => n > 0

// un-fancy
items.filter(x => isEven(x) || isPositive(x))

// fancy
items.filter(or(isEven, isPositive))
```

## Install

```sh
npm install --save fp-and-or
```

## Usage

```js
const { and, or } = require('fp-and-or')

<%=usage%>
