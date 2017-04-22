
import executeFunction from 'yox-common/function/execute'

import * as env from 'yox-common/util/env'
import * as keypathUtil from 'yox-common/util/keypath'

import * as nodeType from './src/nodeType'

import BinaryNode from './src/node/Binary'
import UnaryNode from './src/node/Unary'

let executor = { }

executor[ nodeType.LITERAL ] = function (node, context, setKeypath) {
  setKeypath(env.UNDEFINED)
  return node.value
}

executor[ nodeType.IDENTIFIER ] = function (node, context, setKeypath, addDep) {
  let keypath = node.name
  setKeypath(keypath)
  let result = context.get(keypath)
  addDep(result.keypath, result.value)
  return result.value
}

executor[ nodeType.MEMBER ] = function (node, context, setKeypath, addDep) {
  let keypaths = node.props.map(
    function (node, index) {
      let { type } = node
      if (type !== nodeType.LITERAL) {
        if (index > 0) {
          return execute(node, context, setKeypath, addDep)
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
  let keypath = keypathUtil.stringify(keypaths)
  setKeypath(keypath)
  let result = context.get(keypath)
  addDep(result.keypath, result.value)
  return result.value
}

executor[ nodeType.UNARY ] = function (node, context, setKeypath, addDep) {
  setKeypath(env.UNDEFINED)
  return UnaryNode[ node.operator ](
    execute(node.arg, context, setKeypath, addDep)
  )
}

executor[ nodeType.BINARY ] = function (node, context, setKeypath, addDep) {
  setKeypath(env.UNDEFINED)
  let { left, right } = node
  return BinaryNode[ node.operator ](
    execute(left, context, setKeypath, addDep),
    execute(right, context, setKeypath, addDep)
  )
}

executor[ nodeType.TERNARY ] = function (node, context, setKeypath, addDep) {
  setKeypath(env.UNDEFINED)
  let { test, consequent, alternate } = node
  return execute(test, context, setKeypath, addDep)
    ? execute(consequent, context, setKeypath, addDep)
    : execute(alternate, context, setKeypath, addDep)
}

executor[ nodeType.ARRAY ] = function (node, context, setKeypath, addDep) {
  setKeypath(env.UNDEFINED)
  return node.elements.map(
    function (node) {
      return execute(node, context, setKeypath, addDep)
    }
  )
}

executor[ nodeType.CALL ] = function (node, context, setKeypath, addDep) {
  setKeypath(env.UNDEFINED)
  return executeFunction(
    execute(node.callee, context, setKeypath, addDep),
    env.NULL,
    node.args.map(
      function (node) {
        return execute(node, context, setKeypath, addDep)
      }
    )
  )
}

/**
 * 表达式求值
 *
 * @param {Node} node
 * @param {Context} context
 * @param {?Function} setKeypath
 * @param {?Function} addDep
 * @return {*}
 */
export default function execute(node, context, setKeypath, addDep) {
  return executor[ node.type ](node, context, setKeypath || env.noop, addDep || env.noop)
}
