import executeFunction from 'yox-common/function/execute'

import * as char from 'yox-common/util/char'
import * as array from 'yox-common/util/array'
import * as keypathUtil from 'yox-common/util/keypath'

import * as nodeType from '../nodeType'
import * as interpreter from '../interpreter'

import Node from '../node/Node'
import Call from '../node/Call'
import Member from '../node/Member'
import Literal from '../node/Literal'
import Identifier from '../node/Identifier'
import Unary from '../node/Unary'
import Binary from '../node/Binary'
import Ternary from '../node/Ternary'

import ArrayNode from '../node/Array'
import ObjectNode from '../node/Object'

const nodeExecutor = {}

nodeExecutor[nodeType.LITERAL] = function (node: Literal) {
  return node.value
}

nodeExecutor[nodeType.IDENTIFIER] = function (node: Identifier, getter: (keypath: string, node: Node) => any): any {
  return getter(node.name, node)
}

nodeExecutor[nodeType.MEMBER] = function (node: Member, getter: (keypath: string, node: Node) => any, context: any): any {
  let keypath = node.staticKeypath
  if (!keypath) {
    keypath = char.CHAR_BLANK
    array.each(
      node.props,
      function (node: Node, index: number) {
        let type = node.type, next = char.CHAR_BLANK
        if (type !== nodeType.LITERAL) {
          if (index > 0) {
            next = execute(node, getter, context)
          }
          else if (type === nodeType.IDENTIFIER) {
            next = (node as Identifier).name
          }
        }
        else {
          next = (node as Literal).value
        }
        keypath = keypathUtil.join(keypath as string, next)
      }
    )
  }
  return getter(keypath, node)
}

nodeExecutor[nodeType.UNARY] = function (node: Unary, getter: (keypath: string, node: Node) => any, context: any): any {
  return interpreter.unary[node.operator](
    execute(node.arg, getter, context)
  )
}

nodeExecutor[nodeType.BINARY] = function (node: Binary, getter: (keypath: string, node: Node) => any, context: any): any {
  return interpreter.binary[node.operator].exec(
    execute(node.left, getter, context),
    execute(node.right, getter, context)
  )
}

nodeExecutor[nodeType.TERNARY] = function (node: Ternary, getter: (keypath: string, node: Node) => any, context: any): any {
  return execute(node.test, getter, context)
    ? execute(node.yes, getter, context)
    : execute(node.no, getter, context)
}

nodeExecutor[nodeType.ARRAY] = function (node: ArrayNode, getter: (keypath: string, node: Node) => any, context: any): any {
  return node.elements.map(
    function (node) {
      return execute(node, getter, context)
    }
  )
}

nodeExecutor[nodeType.OBJECT] = function (node: ObjectNode, getter: (keypath: string, node: Node) => any, context: any): any {
  let result = {}
  array.each(
    node.keys,
    function (key, index) {
      result[key] = execute(node.values[index], getter, context)
    }
  )
  return result
}

nodeExecutor[nodeType.CALL] = function (node: Call, getter: (keypath: string, node: Node) => any, context: any): any {
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

export function execute(node: Node, getter: (keypath: string, node: Node) => any, context: any): any {
  return nodeExecutor[node.type](node, getter, context)
}
