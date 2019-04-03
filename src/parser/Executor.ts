import executeFunction from 'yox-common/function/execute'

import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as array from 'yox-common/util/array'
import * as keypathUtil from 'yox-common/util/keypath'

import * as nodeType from '../nodeType'
import * as interpreter from '../interpreter'

import Node from '../node/Node'
import Literal from '../node/Literal'
import Identifier from '../node/Identifier'
import Member from '../node/Member';
import Unary from '../node/Unary';
import Binary from '../node/Binary';
import Ternary from '../node/Ternary';
import Call from '../node/Call';

import ArrayNode from '../node/Array'
import ObjectNode from '../node/Object'

const executor = {}

executor[nodeType.LITERAL] = function (node: Literal) {
  return node.value
}

executor[nodeType.IDENTIFIER] = function (node: Identifier, getter: (keypath: string, node: Node) => any): any {
  return getter(node.name, node)
}

executor[nodeType.MEMBER] = function (node: Member, getter: (keypath: string, node: Node) => any, context: any): any {
  let keypath = node.staticKeypath
  if (!keypath) {
    keypath = char.CHAR_BLANK
    array.each(
      node.props,
      function (node, index) {
        let type = node.type, next = char.CHAR_BLANK
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

executor[nodeType.UNARY] = function (node: Unary, getter: (keypath: string, node: Node) => any, context: any): any {
  return interpreter.unary[node.operator](
    execute(node.arg, getter, context)
  )
}

executor[nodeType.BINARY] = function (node: Binary, getter: (keypath: string, node: Node) => any, context: any): any {
  return interpreter.binary[node.operator].exec(
    execute(node.left, getter, context),
    execute(node.right, getter, context)
  )
}

executor[nodeType.TERNARY] = function (node: Ternary, getter: (keypath: string, node: Node) => any, context: any): any {
  return execute(node.test, getter, context)
    ? execute(node.yes, getter, context)
    : execute(node.no, getter, context)
}

executor[nodeType.ARRAY] = function (node: ArrayNode, getter: (keypath: string, node: Node) => any, context: any): any {
  return node.elements.map(
    function (node) {
      return execute(node, getter, context)
    }
  )
}

executor[nodeType.OBJECT] = function (node: ObjectNode, getter: (keypath: string, node: Node) => any, context: any): any {
  let result = {}
  array.each(
    node.keys,
    function (key, index) {
      result[key] = execute(node.values[index], getter, context)
    }
  )
  return result
}

executor[nodeType.CALL] = function (node: Call, getter: (keypath: string, node: Node) => any, context: any): any {
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

export function execute(node: Node, getter: (keypath: string, node: Node) => any, context: any): any {
  return executor[node.type](node, getter, context)
}
