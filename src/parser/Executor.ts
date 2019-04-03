import * as env from 'yox-common/util/env'
import * as nodeType from '../nodeType'
import Literal from '../node/Literal';
import Identifier from '../node/Identifier';

const executor = {}

executor[nodeType.LITERAL] = function (node: Literal) {
  return node.value
}

executor[nodeType.IDENTIFIER] = function (node: Identifier, getter: Function) {
  return getter(node.name, node)
}

executor[nodeType.MEMBER] = function (node, getter, context) {
  let keypath = node[env.RAW_STATIC_KEYPATH]
  if (!keypath) {
    keypath = char.CHAR_BLANK
    array.each(
      node.props,
      function (node, index) {
        let type = node[env.RAW_TYPE], next = char.CHAR_BLANK
        if (type !== nodeType.LITERAL) {
          if (index > 0) {
            next = execute(node, getter, context)
          }
          else if (type === nodeType.IDENTIFIER) {
            next = node[env.RAW_NAME]
          }
        }
        else {
          next = node[env.RAW_VALUE]
        }
        keypath = keypathUtil.join(keypath, next)
      }
    )
  }
  return getter(keypath, node)
}

executor[nodeType.UNARY] = function (node, getter, context) {
  return interpreter.unary[node.operator](
    execute(node.arg, getter, context)
  )
}

executor[nodeType.BINARY] = function (node, getter, context) {
  return interpreter.binary[node.operator](
    execute(node.left, getter, context),
    execute(node.right, getter, context)
  )
}

executor[nodeType.TERNARY] = function (node, getter, context) {
  return execute(node.test, getter, context)
    ? execute(node.yes, getter, context)
    : execute(node.no, getter, context)
}

executor[nodeType.ARRAY] = function (node, getter, context) {
  return node.elements.map(
    function (node) {
      return execute(node, getter, context)
    }
  )
}

executor[nodeType.OBJECT] = function (node, getter, context) {
  let result = {}
  array.each(
    node.keys,
    function (key, index) {
      result[key] = execute(node.values[index], getter, context)
    }
  )
  return result
}

executor[nodeType.CALL] = function (node, getter, context) {
  let { args } = node
  if (args) {
    args = args.map(
      function (node) {
        return execute(node, getter, context)
      }
    )
  }
  return executeFunction(
    execute(node.callee, getter, context),
    context,
    args
  )
}
