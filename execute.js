
import executeFunction from 'yox-common/function/execute'
import * as keypathUtil from 'yox-common/util/keypath'

import * as nodeType from './src/nodeType'
import * as interpreter from './src/interpreter'

import MemberNode from './src/node/Member'

const executor = { }

executor[ nodeType.LITERAL ] = function (node) {
  return node.value
}

executor[ nodeType.IDENTIFIER ] = function (node, getter, context) {
  return getter(node.name)
}

executor[ nodeType.MEMBER ] = function (node, getter, context) {
  let { keypath } = node
  if (!keypath) {
    let keypaths = node.props.map(
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
    keypath = keypathUtil.stringify(keypaths, env.FALSE)
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
    ? execute(node.consequent, getter, context)
    : execute(node.alternate, getter, context)
}

executor[ nodeType.ARRAY ] = function (node, getter, context) {
  return node.elements.map(
    function (node) {
      return execute(node, getter, context)
    }
  )
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
