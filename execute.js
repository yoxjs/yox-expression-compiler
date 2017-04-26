
import executeFunction from 'yox-common/function/execute'

import * as nodeType from './src/nodeType'

import UnaryNode from './src/node/Unary'
import BinaryNode from './src/node/Binary'
import MemberNode from './src/node/Member'

let executor = { }

executor[ nodeType.LITERAL ] = function (node) {
  return node.value
}

executor[ nodeType.IDENTIFIER ] = function (node, getter, context) {
  return getter(node.name)
}

executor[ nodeType.MEMBER ] = function (node, getter, context) {
  let { keypath } = node
  if (!keypath) {
    keypath = MemberNode.stringify(
      node,
      function (node) {
        return execute(node, getter, context)
      }
    )
  }
  return getter(keypath)
}

executor[ nodeType.UNARY ] = function (node, getter, context) {
  return UnaryNode[ node.operator ](
    execute(node.arg, getter, context)
  )
}

executor[ nodeType.BINARY ] = function (node, getter, context) {
  let { left, right } = node
  return BinaryNode[ node.operator ](
    execute(left, getter, context),
    execute(right, getter, context)
  )
}

executor[ nodeType.TERNARY ] = function (node, getter, context) {
  let { test, consequent, alternate } = node
  return execute(test, getter, context)
    ? execute(consequent, getter, context)
    : execute(alternate, getter, context)
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
