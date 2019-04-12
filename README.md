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


报错信息不全

如 on-click="open())" 后面多打了一个 ) 没提示