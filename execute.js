
import executeFunction from 'yox-common/function/execute'

import * as env from 'yox-common/util/env'
import * as keypathUtil from 'yox-common/util/keypath'

import * as nodeType from './src/nodeType'

import UnaryNode from './src/node/Unary'
import BinaryNode from './src/node/Binary'
import MemberNode from './src/node/Member'

let executor = { }

executor[ nodeType.LITERAL ] = function (node, context) {
  return node.value
}

executor[ nodeType.IDENTIFIER ] = function (node, context, addDep) {
  let result = context.get(node.name)
  addDep && addDep(result.keypath, result.value)
  return result.value
}

executor[ nodeType.MEMBER ] = function (node, context, addDep) {
  let { keypath } = node
  if (!keypath) {
    keypath = MemberNode.stringify(
      node,
      function (node) {
        return execute(node, context, addDep)
      }
    )
  }
  let result = context.get(keypath)
  addDep && addDep(result.keypath, result.value)
  return result.value
}

executor[ nodeType.UNARY ] = function (node, context, addDep) {
  return UnaryNode[ node.operator ](
    execute(node.arg, context, addDep)
  )
}

executor[ nodeType.BINARY ] = function (node, context, addDep) {
  let { left, right } = node
  return BinaryNode[ node.operator ](
    execute(left, context, addDep),
    execute(right, context, addDep)
  )
}

executor[ nodeType.TERNARY ] = function (node, context, addDep) {
  let { test, consequent, alternate } = node
  return execute(test, context, addDep)
    ? execute(consequent, context, addDep)
    : execute(alternate, context, addDep)
}

executor[ nodeType.ARRAY ] = function (node, context, addDep) {
  return node.elements.map(
    function (node) {
      return execute(node, context, addDep)
    }
  )
}

executor[ nodeType.CALL ] = function (node, context, addDep) {
  return executeFunction(
    execute(node.callee, context, addDep),
    context.get('$context').value,
    node.args.map(
      function (node) {
        return execute(node, context, addDep)
      }
    )
  )
}

/**
 * 表达式求值
 *
 * @param {Node} node
 * @param {Context} context
 * @param {?Function} addDep
 * @return {*}
 */
export default function execute(node, context, addDep) {
  return executor[ node.type ](node, context, addDep)
}
