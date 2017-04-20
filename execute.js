
import executeFunction from 'yox-common/function/execute'

import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'
import * as keypathUtil from 'yox-common/util/keypath'

import * as nodeType from './src/nodeType'

import BinaryNode from './src/node/Binary'
import MemberNode from './src/node/Member'
import UnaryNode from './src/node/Unary'

/**
 * 表达式求值
 *
 * @param {Node} node
 * @param {Context} context
 * @return {*}
 */
export default function execute(node, context) {

  let deps = { }, value, keypath

  let executor = { }

  executor[ nodeType.ARRAY ] = function (node) {
    keypath = env.UNDEFINED
    value = [ ]
    array.each(
      node.elements,
      function (node) {
        array.push(value, executor[ node.type ](node))
      }
    )
    return value
  }

  executor[ nodeType.UNARY ] = function (node) {
    keypath = env.UNDEFINED
    return UnaryNode[ node.operator ](
      executor[ node.arg.type ](node.arg)
    )
  }

  executor[ nodeType.BINARY ] = function (node) {
    keypath = env.UNDEFINED
    let { left, right } = node
    return BinaryNode[ node.operator ](
      executor[ left.type ](left),
      executor[ right.type ](right)
    )
  }

  executor[ nodeType.TERNARY ] = function (node) {
    keypath = env.UNDEFINED
    let { test, consequent, alternate } = node
    if (executor[ test.type ](test)) {
      return executor[ consequent.type ](consequent)
    }
    else {
      return executor[ alternate.type ](alternate)
    }
  }

  executor[ nodeType.CALL ] = function (node) {
    keypath = env.UNDEFINED
    return executeFunction(
      executor[ node.callee.type ](node.callee),
      env.NULL,
      node.args.map(
        function (node) {
          return executor[ node.type ](node)
        }
      )
    )
  }

  executor[ nodeType.LITERAL ] = function (node) {
    keypath = env.UNDEFINED
    return node.value
  }

  executor[ nodeType.IDENTIFIER ] = function (node) {
    keypath = node.name
    let result = context.get(keypath)
    deps[ result.keypath ] = result.value
    return result.value
  }

  executor[ nodeType.MEMBER ] = function (node) {
    let keypaths = [ ]
    array.each(
      MemberNode.flatten(node),
      function (node, index) {
        let { type } = node
        if (type !== nodeType.LITERAL) {
          if (index > 0) {
            array.push(keypaths, executor[ type ](node))
          }
          else if (type === nodeType.IDENTIFIER) {
            array.push(keypaths, node.name)
          }
        }
        else {
          array.push(keypaths, node.value)
        }
      }
    )
    keypath = keypathUtil.stringify(keypaths)
    let result = context.get(keypath)
    deps[ result.keypath ] = result.value
    return result.value
  }

  return {
    value: executor[ node.type ](node),
    deps,
    keypath,
  }

}
