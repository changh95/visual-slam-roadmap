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

const isEven = n => n % 2 === 0
const isPositive = n => n > 0
const isBig = n => Math.abs(n) >= 1000
```

### and

#### return true with no predicates
```js
and()(1) // true
```

#### return result of single predicate
```js
and(isEven)(1) // false
and(isEven)(2) // true
```

#### return logical AND of two predicates
```js
and(isEven, isPositive)(-2) // false
and(isEven, isPositive)(-1) // false
and(isEven, isPositive)(1) // false
and(isEven, isPositive)(2) // true
```

#### return logical AND of three predicates
```js
and(isEven, isPositive, isBig)(-2) // false
and(isEven, isPositive, isBig)(-1) // false
and(isEven, isPositive, isBig)(1) // false
and(isEven, isPositive, isBig)(2) // false
and(isEven, isPositive, isBig)(-1002) // false
and(isEven, isPositive, isBig)(-1001) // false
and(isEven, isPositive, isBig)(1001) // false
and(isEven, isPositive, isBig)(1002) // true
```

#### return value of single boolean
```js
and(true)(1) // true
and(false)(1) // false
```

#### return value of two booleans
```js
and(false, false)(1) // false
and(false, true)(1) // false
and(true, false)(1) // false
and(true, true)(1) // true
```

#### return value of multiple booleans
```js
and(false, false, false)(1) // false
and(false, true, false)(1) // false
and(true, false, false)(1) // false
and(true, true, false)(1) // false
and(false, false, true)(1) // false
and(false, true, true)(1) // false
and(true, false, true)(1) // false
and(true, true, true)(1) // true
```

#### return value of mixed booleans and functions
```js
and(false, isEven)(1) // false
and(false, isEven)(2) // false
and(true, isEven)(1) // false
and(true, isEven)(2) // true
and(isEven, false)(1) // false
and(isEven, false)(2) // false
and(isEven, true)(1) // false
and(isEven, true)(2) // true
```

### or

#### return false with no predicates
```js
or()(1) // false
```

#### return result of single predicate
```js
or(isEven)(1) // false
or(isEven)(2) // true
```

#### return logical OR of two predicates
```js
or(isEven, isPositive)(-2) // true
or(isEven, isPositive)(-1) // false
or(isEven, isPositive)(1) // true
or(isEven, isPositive)(2) // true
```

#### return logical OR of three predicates
```js
or(isEven, isPositive, isBig)(-2) // true
or(isEven, isPositive, isBig)(-1) // false
or(isEven, isPositive, isBig)(0) // true
or(isEven, isPositive, isBig)(1) // true
or(isEven, isPositive, isBig)(2) // true
or(isEven, isPositive, isBig)(-1002) // true
or(isEven, isPositive, isBig)(-1001) // true
or(isEven, isPositive, isBig)(1001) // true
or(isEven, isPositive, isBig)(1002) // true
```

#### return value of single boolean
```js
or(true)(1) // true
or(false)(1) // false
```

#### return value of two booleans
```js
or(false, false)(1) // false
or(false, true)(1) // true
or(true, false)(1) // true
or(true, true)(1) // true
```

#### return value of multiple booleans
```js
or(false, false, false)(1) // false
or(false, true, false)(1) // true
or(true, false, false)(1) // true
or(true, true, false)(1) // true
or(false, false, true)(1) // true
or(false, true, true)(1) // true
or(true, false, true)(1) // true
or(true, true, true)(1) // true
```

#### return value of mixed booleans and functions
```js
or(false, isEven)(1) // false
or(false, isEven)(2) // true
or(true, isEven)(1) // true
or(true, isEven)(2) // true
or(isEven, false)(1) // false
or(isEven, false)(2) // true
or(isEven, true)(1) // true
or(isEven, true)(2) // true
```

