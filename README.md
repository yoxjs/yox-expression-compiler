# yox-expression-compiler

Expression compiler for Yox.js

```js
import * as expressionCompiler from 'yox-expression-compiler'

// 编译成表达式节点
let node = expressionCompiler.compile('a + b')

// 序列化
expressionCompiler.stringify(node) // a + b

// 求值
// 必须提供 get 函数取值，取值结果格式如下
// {
//     value: '求值结果',
//     deps: {
//         dep1: dep1Value,
//         dep2: dep2Value,
//     }
// }
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
