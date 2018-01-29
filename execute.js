
import executeFunction from 'yox-common/function/execute'

import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'

import * as nodeType from './src/nodeType'
import * as interpreter from './src/interpreter'

const executor = { }

executor[ nodeType.LITERAL ] = function (node) {
  return node.value
}

executor[ nodeType.IDENTIFIER ] = function (node, getter) {
  return getter(node.name)
}

executor[ nodeType.MEMBER ] = function (node, getter, context) {
  let keypath = node.staticKeypath
  if (!keypath) {
    keypath =
    node.dynamicKeypath = node.props
      .map(
        function (node, index) {
          let { type } = node
          if (type !== nodeType.LITERAL) {
            if (index > 0) {
              return execute(node, getter, context)
            }
            else if (type === nodeType.IDENTIFIER) {
              return node.name
            }
          }
          else {
            return node.value
          }
        }
      )
      .join(env.KEYPATH_SEPARATOR)
  }
  return getter(keypath)
}

executor[ nodeType.UNARY ] = function (node, getter, context) {
  return interpreter.unary[ node.operator ](
    execute(node.arg, getter, context)
  )
}

executor[ nodeType.BINARY ] = function (node, getter, context) {
  return interpreter.binary[ node.operator ](
    execute(node.left, getter, context),
    execute(node.right, getter, context)
  )
}

executor[ nodeType.TERNARY ] = function (node, getter, context) {
  return execute(node.test, getter, context)
    ? execute(node.yes, getter, context)
    : execute(node.no, getter, context)
}

executor[ nodeType.ARRAY ] = function (node, getter, context) {
  return node.elements.map(
    function (node) {
      return execute(node, getter, context)
    }
  )
}

executor[ nodeType.OBJECT ] = function (node, getter, context) {
  let result = { }
  array.each(
    node.keys,
    function (key, index) {
      result[ key ] = execute(node.values[ index ], getter, context)
    }
  )
  return result
}

executor[ nodeType.CALL ] = function (node, getter, context) {
  return executeFunction(
    execute(node.callee, getter, context),
    context,
    node.args.map(
      function (node) {
        return execute(node, getter, context)
      }
    )
  )
}

/**
 * 表达式求值
 *
 * @param {Node} node 表达式抽象节点
 * @param {Function} getter 读取数据的方法
 * @param {*} context 表达式函数调用的执行上下文
 * @return {*}
 */
export default function execute(node, getter, context) {
  return executor[ node.type ](node, getter, context)
}
