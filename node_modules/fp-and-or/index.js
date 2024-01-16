/** Wraps a value in a function. If given a function, returns it as-is. */
const wrap = x => typeof x === 'function' ? x : () => x

/** Returns a predicate that returns true if all arguments are true or evaluate to true for the given input. */
const and = (...fs) => (...args) =>
  fs.length === 0 || (
    !!wrap(fs[0])(...args) &&
    and(...fs.slice(1))(...args)
  )

/** Returns a predicate that returns true if at least one argument is true or evaluates to true for the given input. */
const or = (...fs) => (...args) =>
  fs.length > 0 && (
    !!wrap(fs[0])(...args) ||
    or(...fs.slice(1))(...args)
  )

module.exports = { and, or }
