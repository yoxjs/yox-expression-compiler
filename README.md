# yox-expression-compiler

Expression compiler for yox.js

```js
import * as expressionCompiler from 'yox-expression-compiler'

// 编译成表达式节点
let node = expressionCompiler.compile('a + b')

// 序列化
expressionCompiler.stringify(node) // a + b

// 求值
expressionCompiler.execute(
  node,
  {
    get: function (key) {
      return {
        value: 'value',
        deps: {
          keypath: 'keypath value'
        }
      }
    }
  }
)
``
