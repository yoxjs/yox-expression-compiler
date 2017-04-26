
import executeFunction from 'yox-common/function/execute'

import * as nodeType from './src/nodeType'

import UnaryNode from './src/node/Unary'
import BinaryNode from './src/node/Binary'
import MemberNode from './src/node/Member'

let executor = { }

executor[ nodeType.LITERAL ] = function (node, context) {
  return node.value
}

executor[ nodeType.IDENTIFIER ] = function (node, context, instance, addDep) {
  let result = context.get(node.name)
  addDep && addDep(result.keypath, result.value)
  return result.value
}

executor[ nodeType.MEMBER ] = function (node, context, instance, addDep) {
  let { keypath } = node
  if (!keypath) {
    keypath = MemberNode.stringify(
      node,
      function (node) {
        return execute(node, context, instance, addDep)
      }
    )
  }
  let result = context.get(keypath)
  addDep && addDep(result.keypath, result.value)
  return result.value
}

executor[ nodeType.UNARY ] = function (node, context, instance, addDep) {
  return UnaryNode[ node.operator ](
    execute(node.arg, context, instance, addDep)
  )
}

executor[ nodeType.BINARY ] = function (node, context, instance, addDep) {
  let { left, right } = node
  return BinaryNode[ node.operator ](
    execute(left, context, instance, addDep),
    execute(right, context, instance, addDep)
  )
}

executor[ nodeType.TERNARY ] = function (node, context, instance, addDep) {
  let { test, consequent, alternate } = node
  return execute(test, context, instance, addDep)
    ? execute(consequent, context, instance, addDep)
    : execute(alternate, context, instance, addDep)
}

executor[ nodeType.ARRAY ] = function (node, context, instance, addDep) {
  return node.elements.map(
    function (node) {
      return execute(node, context, instance, addDep)
    }
  )
}

executor[ nodeType.CALL ] = function (node, context, instance, addDep) {
  return executeFunction(
    execute(node.callee, context, instance, addDep),
    instance,
    node.args.map(
      function (node) {
        return execute(node, context, instance, addDep)
      }
    )
  )
}

/**
 * 表达式求值
 *
 * @param {Node} node 表达式抽象节点
 * @param {Context} context 读取数据的容器
 * @param {Yox} instance 表达式函数调用的执行上下文
 * @param {?Function} addDep 添加执行表达式过程中的依赖
 * @return {*}
 */
export default function execute(node, context, instance, addDep) {
  return executor[ node.type ](node, context, instance, addDep)
}
