
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

  let deps = { }, value, keypath, result

  switch (node.type) {
    case nodeType.ARRAY:
      value = [ ]
      array.each(
        node.elements,
        function (node) {
          result = execute(node, context)
          array.push(value, result.value)
          object.extend(deps, result.deps)
        }
      )
      break

    case nodeType.BINARY:
      let { left, right } = node
      left = execute(left, context)
      right = execute(right, context)
      value = BinaryNode[ node.operator ](left.value, right.value)
      object.extend(deps, left.deps, right.deps)
      break

    case nodeType.CALL:
      result = execute(node.callee, context)
      deps = result.deps
      value = executeFunction(
        result.value,
        env.NULL,
        node.args.map(
          function (node) {
            let result = execute(node, context)
            object.extend(deps, result.deps)
            return result.value
          }
        )
      )
      break

    case nodeType.TERNARY:
      let { test, consequent, alternate } = node
      test = execute(test, context)
      if (test.value) {
        consequent = execute(consequent, context)
        value = consequent.value
        object.extend(deps, test.deps, consequent.deps)
      }
      else {
        alternate = execute(alternate, context)
        value = alternate.value
        object.extend(deps, test.deps, alternate.deps)
      }
      break

    case nodeType.IDENTIFIER:
      keypath = node.name
      result = context.get(keypath)
      value = result.value
      deps[ result.keypath ] = value
      break

    case nodeType.LITERAL:
      value = node.value
      break

    case nodeType.MEMBER:
      let keys = [ ]
      array.each(
        MemberNode.flatten(node),
        function (node, index) {
          let { type } = node
          if (type !== nodeType.LITERAL) {
            if (index > 0) {
              let result = execute(node, context)
              array.push(keys, result.value)
              object.extend(deps, result.deps)
            }
            else if (type === nodeType.IDENTIFIER) {
              array.push(keys, node.name)
            }
          }
          else {
            array.push(keys, node.value)
          }
        }
      )
      keypath = keypathUtil.stringify(keys)
      result = context.get(keypath)
      value = result.value
      deps[ result.keypath ] = value
      break

    case nodeType.UNARY:
      result = execute(node.arg, context)
      value = UnaryNode[ node.operator ](result.value)
      deps = result.deps
      break
  }

  return { value, deps, keypath }

}
