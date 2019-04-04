import isDef from 'yox-common/function/isDef'
import executeFunction from 'yox-common/function/execute'

import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'
import * as keypathUtil from 'yox-common/util/keypath'

import * as nodeType from './nodeType'
import * as interpreter from './interpreter'

import Node from './node/Node'
import Identifier from './node/Identifier'
import Literal from './node/Literal'
import Member from './node/Member'
import Ternary from './node/Ternary'
import Binary from './node/Binary'
import Unary from './node/Unary'
import Call from './node/Call'

import ArrayNode from './node/Array'
import ObjectNode from './node/Object'

const nodeExecutor = {}

nodeExecutor[nodeType.LITERAL] = function (node: Literal) {
  return node.value
}

nodeExecutor[nodeType.IDENTIFIER] = function (node: Identifier, getter: (keypath: string, node: Node) => any): any {
  return getter(node.name, node)
}

nodeExecutor[nodeType.MEMBER] = function (node: Member, getter?: (keypath: string, node: Node) => any, context?: any): any {

  /**
   * 先说第一种奇葩情况：
   *
   * 'xx'.length
   *
   * 没有变量数据，直接执行字面量，这里用不上 getter
   *
   * 第二种：
   *
   * a.b.c
   *
   * 这是常规操作
   *
   * 第三种：
   *
   * 'xx'[name]
   *
   * 以字面量开头，后面会用到变量
   *
   */

  let { props, staticKeypath } = node, first: any, data: any

  if (!staticKeypath) {

    // props 至少两个，否则无法创建 Member
    first = props[0]

    if (first.type === nodeType.IDENTIFIER) {
      staticKeypath = (first as Identifier).name
    }
    else {
      data = execute(first, getter, context)
    }

    for (let i = 1, len = props.length; i < len; i++) {
      staticKeypath = keypathUtil.join(
        staticKeypath,
        execute(props[i], getter, context)
      )
    }

  }

  if (isDef(data)) {
    data = object.get(data, staticKeypath as string)
    return data ? data.value : env.UNDEFINED
  }

  if (getter) {
    return getter(staticKeypath as string, node)
  }

}

nodeExecutor[nodeType.UNARY] = function (node: Unary, getter?: (keypath: string, node: Node) => any, context?: any): any {
  return interpreter.unary[node.operator].exec(
    execute(node.arg, getter, context)
  )
}

nodeExecutor[nodeType.BINARY] = function (node: Binary, getter?: (keypath: string, node: Node) => any, context?: any): any {
  return interpreter.binary[node.operator].exec(
    execute(node.left, getter, context),
    execute(node.right, getter, context)
  )
}

nodeExecutor[nodeType.TERNARY] = function (node: Ternary, getter?: (keypath: string, node: Node) => any, context?: any): any {
  return execute(node.test, getter, context)
    ? execute(node.yes, getter, context)
    : execute(node.no, getter, context)
}

nodeExecutor[nodeType.ARRAY] = function (node: ArrayNode, getter?: (keypath: string, node: Node) => any, context?: any): any {
  return node.elements.map(
    function (node) {
      return execute(node, getter, context)
    }
  )
}

nodeExecutor[nodeType.OBJECT] = function (node: ObjectNode, getter?: (keypath: string, node: Node) => any, context?: any): any {
  let result = {}
  array.each(
    node.keys,
    function (key, index) {
      result[key] = execute(node.values[index], getter, context)
    }
  )
  return result
}

nodeExecutor[nodeType.CALL] = function (node: Call, getter?: (keypath: string, node: Node) => any, context?: any): any {
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

export function execute(node: Node, getter?: (keypath: string, node: Node) => any, context?: any): any {
  return nodeExecutor[node.type](node, getter, context)
}
