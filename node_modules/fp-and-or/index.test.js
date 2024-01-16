const { and, or } = require('./index.js')

const isEven = n => n % 2 === 0
const isPositive = n => n > 0
const isBig = n => Math.abs(n) >= 1000

describe('and', () => {

  test('return true with no predicates', () => {
    expect(and()(1)).toBe(true)
  })

  test('return result of single predicate', () => {
    expect(and(isEven)(1)).toBe(false)
    expect(and(isEven)(2)).toBe(true)
  })

  test('return logical AND of two predicates', () => {
    expect(and(isEven, isPositive)(-2)).toBe(false)
    expect(and(isEven, isPositive)(-1)).toBe(false)
    expect(and(isEven, isPositive)(1)).toBe(false)
    expect(and(isEven, isPositive)(2)).toBe(true)
  })

  test('return logical AND of three predicates', () => {
    expect(and(isEven, isPositive, isBig)(-2)).toBe(false)
    expect(and(isEven, isPositive, isBig)(-1)).toBe(false)
    expect(and(isEven, isPositive, isBig)(1)).toBe(false)
    expect(and(isEven, isPositive, isBig)(2)).toBe(false)

    expect(and(isEven, isPositive, isBig)(-1002)).toBe(false)
    expect(and(isEven, isPositive, isBig)(-1001)).toBe(false)
    expect(and(isEven, isPositive, isBig)(1001)).toBe(false)
    expect(and(isEven, isPositive, isBig)(1002)).toBe(true)
  })

  test('return value of single boolean', () => {
    expect(and(true)(1)).toBe(true)
    expect(and(false)(1)).toBe(false)
  })

  test('return value of two booleans', () => {
    expect(and(false, false)(1)).toBe(false)
    expect(and(false, true)(1)).toBe(false)
    expect(and(true, false)(1)).toBe(false)
    expect(and(true, true)(1)).toBe(true)
  })

  test('return value of multiple booleans', () => {
    expect(and(false, false, false)(1)).toBe(false)
    expect(and(false, true, false)(1)).toBe(false)
    expect(and(true, false, false)(1)).toBe(false)
    expect(and(true, true, false)(1)).toBe(false)
    expect(and(false, false, true)(1)).toBe(false)
    expect(and(false, true, true)(1)).toBe(false)
    expect(and(true, false, true)(1)).toBe(false)
    expect(and(true, true, true)(1)).toBe(true)
  })

  test('return value of mixed booleans and functions', () => {
    expect(and(false, isEven)(1)).toBe(false)
    expect(and(false, isEven)(2)).toBe(false)
    expect(and(true, isEven)(1)).toBe(false)
    expect(and(true, isEven)(2)).toBe(true)
    expect(and(isEven, false)(1)).toBe(false)
    expect(and(isEven, false)(2)).toBe(false)
    expect(and(isEven, true)(1)).toBe(false)
    expect(and(isEven, true)(2)).toBe(true)
  })

})

describe('or', () => {

  test('return false with no predicates', () => {
    expect(or()(1)).toBe(false)
  })

  test('return result of single predicate', () => {
    expect(or(isEven)(1)).toBe(false)
    expect(or(isEven)(2)).toBe(true)
  })

  test('return logical OR of two predicates', () => {
    expect(or(isEven, isPositive)(-2)).toBe(true)
    expect(or(isEven, isPositive)(-1)).toBe(false)
    expect(or(isEven, isPositive)(1)).toBe(true)
    expect(or(isEven, isPositive)(2)).toBe(true)
  })

  test('return logical OR of three predicates', () => {
    expect(or(isEven, isPositive, isBig)(-2)).toBe(true)
    expect(or(isEven, isPositive, isBig)(-1)).toBe(false)
    expect(or(isEven, isPositive, isBig)(0)).toBe(true)
    expect(or(isEven, isPositive, isBig)(1)).toBe(true)
    expect(or(isEven, isPositive, isBig)(2)).toBe(true)

    expect(or(isEven, isPositive, isBig)(-1002)).toBe(true)
    expect(or(isEven, isPositive, isBig)(-1001)).toBe(true)
    expect(or(isEven, isPositive, isBig)(1001)).toBe(true)
    expect(or(isEven, isPositive, isBig)(1002)).toBe(true)
  })

  test('return value of single boolean', () => {
    expect(or(true)(1)).toBe(true)
    expect(or(false)(1)).toBe(false)
  })

  test('return value of two booleans', () => {
    expect(or(false, false)(1)).toBe(false)
    expect(or(false, true)(1)).toBe(true)
    expect(or(true, false)(1)).toBe(true)
    expect(or(true, true)(1)).toBe(true)
  })

  test('return value of multiple booleans', () => {
    expect(or(false, false, false)(1)).toBe(false)
    expect(or(false, true, false)(1)).toBe(true)
    expect(or(true, false, false)(1)).toBe(true)
    expect(or(true, true, false)(1)).toBe(true)
    expect(or(false, false, true)(1)).toBe(true)
    expect(or(false, true, true)(1)).toBe(true)
    expect(or(true, false, true)(1)).toBe(true)
    expect(or(true, true, true)(1)).toBe(true)
  })

  test('return value of mixed booleans and functions', () => {
    expect(or(false, isEven)(1)).toBe(false)
    expect(or(false, isEven)(2)).toBe(true)
    expect(or(true, isEven)(1)).toBe(true)
    expect(or(true, isEven)(2)).toBe(true)
    expect(or(isEven, false)(1)).toBe(false)
    expect(or(isEven, false)(2)).toBe(true)
    expect(or(isEven, true)(1)).toBe(true)
    expect(or(isEven, true)(2)).toBe(true)
  })

})
