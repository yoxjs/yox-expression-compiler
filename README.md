# yox-expression-compiler

Expression compiler for Yox.js

```js
import * as expressionCompiler from 'yox-expression-compiler'

// Compile to AST
let node = expressionCompiler.compile('a + b')

// Get value of the expression
let value = expressionCompiler.execute(
  node,
  function (key) {
    return value
  },
  context
)
``
