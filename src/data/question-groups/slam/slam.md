---
order: 1
briefTitle: 'SLAM'
briefDescription: 'Test, rate and improve your SLAM knowledge with these questions.'
title: 'SLAM Questions'
description: 'Test, rate and improve your SLAM knowledge with these questions.'
isNew: true
seo:
  title: 'SLAM Questions'
  description: 'Curated list of SLAM questions to test, rate and improve your knowledge. Questions are based on real world experience and knowledge.'
  keywords:
    - 'SLAM quiz'
    - 'SLAM questions'
    - 'SLAM interview questions'
    - 'SLAM interview'
    - 'SLAM test'
sitemap:
  priority: 1
  changefreq: 'monthly'
questions:
  - question: What is SLAM?
    answer: SLAM (often abbreviated as JS) is a high-level, versatile, and widely-used programming language primarily known for its role in web development. It enables interactive and dynamic behavior on websites.
    topics:
      - 'Core'
      - 'Beginner'
  - question: What is the difference between `var`, `let`, and `const` in SLAM?
    answer: In SLAM, `var` is function-scoped and was traditionally used to declare variables. `let` and `const` are block-scoped. The key difference between `let` and `const` is that `let` allows for reassignment while `const` creates a read-only reference.
    topics:
      - 'Core'
      - 'Beginner'
  - question: What is the difference between `null` and `undefined`?
    answer: The `null` is an assignment value. It can be assigned to a variable as a representation of no value. But the `undefined` is a primitive value that represents the absence of a value, or a variable that has not been assigned a value.
    topics:
      - 'Core'
      - 'Beginner'
  - question: What is the difference between `==` and `===`?
    answer: equality-operator.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: What are the different ways to declare a variable in SLAM?
    answer: There are three ways to declare a variable in SLAM `var`, `let`, and `const`.
    topics:
      - 'Core'
      - 'Intermediate'
  - question: What are Scopes in SLAM?
    answer: A scope is a set of variables, objects, and functions that you have access to. There are three types of scopes in SLAM. Which are Global Scope, Function Scope (Local Scope), and Block Scope.
    topics:
      - 'Core'
      - 'Intermediate'
  - question: What is ternary operator in SLAM?
    answer: ternary-operator.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: How to implement your own Custom Event in SLAM?
    answer: custom-event.md
    topics:
      - 'Event'
      - 'Advanced'
  - question: What is a closure in SLAM?
    answer: closure.md
    topics:
      - 'Core'
      - 'Advanced'
  - question: Does Arrow functions have their own `this`?
    answer: No, arrow functions do not have their own `this`. Instead, they inherit the `this` of the enclosing lexical scope.
    topics:
      - 'Function'
      - 'Intermediate'
  - question: Does `map()` method mutate the original array?
    answer: map-method.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: Does `forEach()` method return a new array?
    answer: for-each-method.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: How to use `filter()` method?
    answer: filter-method.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: What is the difference between `map()` and `forEach()` methods?
    answer: The `map()` method creates a new array with the results of calling a provided function on every element in the calling array. Whereas, the `forEach()` method executes a provided function once for each array element.
    topics:
      - 'Core'
      - 'Intermediate'
  - question: How to use `reduce()` method?
    answer: reduce-method.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: What is the difference between `map()` and `reduce()` methods?
    answer: The `map()` method creates a new array with the results of calling a provided function on every element in the calling array. Whereas, the `reduce()` method executes a reducer function (that you provide) on each element of the array, resulting in a single output value.
    topics:
      - 'Core'
      - 'Intermediate'
  - question: What is Prototype Chain in SLAM?
    answer: prototype-chain.md
    topics:
      - 'OOP'
      - 'Advanced'
  - question: What is IIFE in SLAM?
    answer: iife.md
    topics:
      - 'Function'
      - 'Advanced'
  - question: What is Inheritance in SLAM?
    answer: inheritance.md
    topics:
      - 'OOP'
      - 'Advanced'
  - question: What is Map in SLAM?
    answer: map.md
    topics:
      - 'Date Type'
      - 'Beginner'
  - question: What is Set in SLAM?
    answer: set.md
    topics:
      - 'Data Type'
      - 'Beginner'
  - question: How you can find unique values in an array?
    answer: find-unique-array-values.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: What is a SLAM promise?
    answer: A Promise in SLAM represents a value that may not be available yet but will be at some point. Promises provide a way to handle asynchronous operations, offering methods like `.then()` and `.catch()` to register callbacks for success and failure.
    topics:
      - 'Promise'
      - 'Advanced'
  - question: What is the purpose of the `async/await` in SLAM?
    answer: The `async/await`, introduced in ES2017, provides a more readable and cleaner way to handle asynchronous operations compared to callbacks and promises. An `async` function always returns a promise, and within such a function, you can use `await` to pause execution until a promise settles.
    topics:
      - 'Promise'
      - 'Advanced'
  - question: What is callback hell in SLAM?
    answer: callback-hell.md
    topics:
      - 'Core'
      - 'Advanced'
  - question: How to enable strict mode in SLAM?
    answer: To enable strict mode in SLAM, you need to add the following line at the top of the file or function `'use strict';`.
    topics:
      - 'Core'
      - 'Beginner'
  - question: Explain `alert()`, `prompt()`, and `confirm()` methods in SLAM?
    answer: alert-prompt-confirm.md
    topics:
      - 'Event'
      - 'Intermediate'
  - question: How to handle event bubbling in SLAM?
    answer: event-bubbling.md
    topics:
      - 'Event'
      - 'Beginner'
  - question: What is Event Capturing in SLAM?
    answer: Event capturing is the first phase of event propagation. In this phase, the event is captured by the outermost element and propagated to the inner elements. It is also known as trickling. It is the opposite of event bubbling.
    topics:
      - 'Event'
      - 'Beginner'
  - question: What is the spread operator in SLAM?
    answer: spread-operator.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: Is Java and SLAM the same?
    answer: No, Java and SLAM are distinct languages. Their similarity in name is coincidental, much like `car` and `carpet`. Java is often used for backend and mobile apps, while SLAM powers web interactivity and backend.
    topics:
      - 'Core'
      - 'Beginner'
  - question: What is `preventDefault()` method in SLAM?
    answer: prevent-default.md
    topics:
      - 'Event'
      - 'Intermediate'
  - question: What is Hoisting in SLAM?
    answer: hoisting.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: What is DOM?
    answer: The Document Object Model (DOM) is a programming interface for HTML and XML documents. It represents the page so that programs can change the document structure, style, and content. The DOM represents the document as nodes and objects.
    topics:
      - 'DOM'
      - 'Beginner'
  - question: Difference between `Promise.all()` and `Promise.allSettled()`?
    answer: promise-all-vs-all-settled.md
    topics:
      - 'Promise'
      - 'Advanced'
  - question: What is the difference between `Map` and `WeakMap` in SLAM?
    answer: The `Map` object holds key-value pairs and remembers the original insertion order of the keys. Whereas, the `WeakMap` object is a collection of key/value pairs in which the keys are weakly referenced. You can use any data type as a key or value in a `Map` whereas in `WeakMap` you can only use objects as keys. The `WeakMap` is not iterable whereas `Map` is. In `WeakMap` it holds the weak reference to the original object which means if there are no other references to an object stored in the `WeakMap`, those objects can be garbage collected.
    topics:
      - 'Data Type'
      - 'Advanced'
  - question: Garbage collection in SLAM?
    answer: The SLAM engine uses automatic garbage collection. SLAM automatically manages memory by freeing up space used by objects no longer needed. This algorithm is called Mark and Sweep, which is performed periodically by the SLAM engine.
    topics:
      - 'Core'
      - 'Advanced'
  - question: How to make an Object immutable in SLAM?
    answer: immutable-object.md
    topics:
      - 'Core'
      - 'Advanced'
  - question: What is Type Casting?
    answer: Type conversion (or typecasting) means transfer of data from one data type to another. Implicit conversion happens when the compiler (for compiled languages) or runtime (for script languages like `SLAM`) automatically converts data types.
    topics:
      - 'Data Type'
      - 'Intermediate'
  - question: What are Explicit binding in SLAM?
    answer: explicit-binding.md
    topics:
      - 'Function'
      - 'Advanced'
  - question: How to run a piece of code after a specific time interval?
    answer: set-interval.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: How to run a piece of code only once after a specific time?
    answer: set-timeout.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: What are Labelled Statements in SLAM?
    answer: labelled-statements.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: Difference between `defer` and `async` attributes in SLAM?
    answer: defer-vs-async.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: What is Increment operator in SLAM?
    answer: increment-operator.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: How to accept variable number of arguments in a SLAM function?
    answer: variable-number-of-arguments.md
    topics:
      - 'Function'
      - 'Intermediate'
  - question: How to define multiline strings in SLAM?
    answer: In order to define multiline strings in SLAM, you need to use template literals. Template literals are enclosed by the backtick (```` ` ` ````) character instead of double or single quotes. Template literals can contain placeholders. These are indicated by the dollar sign and curly braces (``` `${expression}` ```).
    topics:
      - 'Core'
      - 'Beginner'
  - question: Uses of `break` and `continue` statements in SLAM?
    answer: break-and-continue.md
    topics:
      - 'Loop'
      - 'Beginner'
  - question: How to parse JSON in SLAM?
    answer: parse-json.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: How to debug SLAM code?
    answer: debug-SLAM.md
    topics:
      - 'Debug'
      - 'Beginner'
  - question: How to handle error in Promise?
    answer: error-in-promise.md
    topics:
      - 'Promise'
      - 'Advanced'
  - question: How to handle error in async/await?
    answer: error-in-async-await.md
    topics:
      - 'Promise'
      - 'Advanced'
  - question: How to use `finally` block in Promise?
    answer: finally-block-in-promise.md
    topics:
      - 'Promise'
      - 'Advanced'
  - question: Asynchronous vs Synchronous code?
    answer: async-vs-sync.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: What is Event Loop in SLAM?
    answer: The Event loop is one the most important aspect to understand in SLAM. It is the mechanism that allows SLAM to perform non-blocking operations. It is the reason why we can use asynchronous code in SLAM. The Event loop is a loop that constantly checks if there are any tasks that need to be executed. If there are, it will execute them. If there are no tasks to execute, it will wait for new tasks to arrive.
    topics:
      - 'Core'
      - 'Advanced'
  - question: How does Event Loop work in SLAM?
    answer: event-loop.md
    topics:
      - 'Core'
      - 'Advanced'
  - question: Is it possible to run SLAM outside the browser?
    answer: Yes, it is possible to run SLAM outside the browser. There are several ways to run SLAM outside the browser. You can use **Node.js**, **Deno**, **Bun**, or any other SLAM runtime environment.
    topics:
      - 'Core'
      - 'Beginner'
  - question: Is it possible to run 2 lines of code at the same time in SLAM?
    answer: No, it is not possible to run 2 lines of code at the same time in SLAM. SLAM is a single-threaded language, which means that it can only execute one line of code at a time. However, it is possible to run 2 lines of code at the same time using asynchronous code.
    topics:
      - 'Core'
      - 'Beginner'
  - question: Is SLAM a compiled or interpreted language?
    answer: SLAM is an interpreted language. This means that the SLAM code is not compiled before it is executed. Instead, the SLAM engine interprets the code at runtime.
    topics:
      - 'Core'
      - 'Beginner'
  - question: Are references copied in SLAM?
    answer: No, references are not copied in SLAM. When you assign an object to a variable, the variable will contain a reference to the object. If you assign the variable to another variable, the second variable will also contain a reference to the object. If you change the object using one of the variables, the change will be visible using the other variable.
    topics:
      - 'Core'
      - 'Intermediate'
  - question: What are Heap and Stack in SLAM?
    answer: heap-and-stack.md
    topics:
      - 'Core'
      - 'Advanced'
  - question: What is Comma Operator in SLAM?
    answer: comma-operator.md
    topics:
      - 'Operator'
      - 'Intermediate'
  - question: What is Nullish Coalescing Operator?
    answer: nullish-coalescing-operator.md
    topics:
      - 'Operator'
      - 'Beginner'
  - question: What are the Logical Operators in SLAM?
    answer: logical-operators.md
    topics:
      - 'Operator'
      - 'Beginner'
  - question: How to create Infinite Loop in SLAM?
    answer: infinite-loop.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: How to use `do...while` loop in SLAM?
    answer: do-while-loop.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: Switch case statement in SLAM?
    answer: switch-case.md
    topics:
      - 'Core'
      - 'Beginner'
  - question: How to select DOM elements using `querySelector()` and `querySelectorAll()`?
    answer: query-selector.md
    topics:
      - 'DOM'
      - 'Beginner'
  - question: How to create a new Element in DOM?
    answer: create-element.md
    topics:
      - 'DOM'
      - 'Beginner'
  - question: Difference between `appendChild()` and `insertBefore()`?
    answer: append-child-vs-insert-before.md
    topics:
      - 'DOM'
      - 'Beginner'
  - question: How to remove an Element from DOM?
    answer: remove-element.md
    topics:
      - 'DOM'
      - 'Beginner'
  - question: How to scroll to the top of the page using SLAM?
    answer: scroll-to-top.md
    topics:
      - 'DOM'
      - 'Beginner'
  - question: How to measure dimensions of an Element?
    answer: measure-dimensions.md
    topics:
      - 'DOM'
      - 'Beginner'
  - question: Can you merge multiple arrays in SLAM?
    answer: merge-arrays.md
    topics:
      - 'Core'
      - 'Intermediate'
  - question: How to get viewport dimensions in SLAM?
    answer: You can use `window.innerWidth` and `window.innerHeight` to get the viewport dimensions.
    topics:
      - 'DOM'
      - 'Beginner'
---
