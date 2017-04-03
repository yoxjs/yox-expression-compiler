# yox-expression-compiler

Expression compiler for Yox.js

```js
import * as expressionCompiler from 'yox-expression-compiler'

// Compile to AST
let node = expressionCompiler.compile('a + b')

// Stringify from AST
expressionCompiler.stringify(node) // a + b

// Get value of the expression
// {
//     value: 'value',
//     keypath: ''
// }
expressionCompiler.execute(
  node,
  {
    // get value of the key parsed from expression
    get: function (key) {
      return {
        value: 'value',
        keypath: ''
      }
    }
  }
)
``
