import toString from 'yox-common/src/function/toString'

import * as env from 'yox-common/src/util/env'
import * as array from 'yox-common/src/util/array'
import * as string from 'yox-common/src/util/string'

import * as nodeType from './nodeType'

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

export function createArray(nodes: Node[], raw: string): ArrayNode {
  return {
    type: nodeType.ARRAY,
    raw,
    nodes,
  }
}

export function createBinary(left: Node, operator: string, right: Node, raw: string): Binary {
  return {
    type: nodeType.BINARY,
    raw,
    left,
    operator,
    right,
  }
}

export function createCall(name: Node, args: Node[], raw: string): Call {
  return {
    type: nodeType.CALL,
    raw,
    name,
    args,
  }
}

export function createIdentifier(raw: string, name: string, isProp?: boolean): Identifier | Literal {

  let lookup = env.TRUE, offset = 0

  if (name === env.KEYPATH_CURRENT
    || name === env.KEYPATH_PARENT
  ) {
    lookup = env.FALSE
    if (name === env.KEYPATH_PARENT) {
      offset = 1
    }
    name = env.EMPTY_STRING
  }

  // 对象属性需要区分 a.b 和 a[b]
  // 如果不借用 Literal 无法实现这个判断
  // 同理，如果用了这种方式，就无法区分 a.b 和 a['b']，但是无所谓，这两种表示法本就一个意思

  return isProp
    ? createLiteral(name, raw)
    : createIdentifierInner(raw, name, lookup, offset)

}

export function createLiteral(value: any, raw: string): Literal {
  return {
    type: nodeType.LITERAL,
    raw,
    value,
  }
}

export function createObject(keys: string[], values: Node[], raw: string): ObjectNode {
  return {
    type: nodeType.OBJECT,
    raw,
    keys,
    values,
  }
}

export function createTernary(test: Node, yes: Node, no: Node, raw: string): Ternary {
  return {
    type: nodeType.TERNARY,
    raw,
    test,
    yes,
    no,
  }
}

export function createUnary(operator: string, node: Node, raw: string): Unary {
  return {
    type: nodeType.UNARY,
    raw,
    operator,
    node,
  }
}

/**
 * 通过判断 nodes 来决定是否需要创建 Member
 *
 * 创建 Member 至少需要 nodes 有两个节点
 */
export function createMemberIfNeeded(raw: string, nodes: Node[]): Node | Identifier | Member {

  // 第一个节点要特殊处理
  let firstNode = nodes.shift() as Node,

  // 是否向上查找
  lookup = env.TRUE,

  // 偏移量，默认从当前 context 开始查找
  offset = 0

  // 表示传入的 nodes 至少有两个节点（弹出了一个）
  if (nodes.length > 0) {

    // 处理剩下的 nodes
    // 这里要做两手准备：
    // 1. 如果全是 literal 节点，则编译时 join
    // 2. 如果不全是 literal 节点，则运行时 join

    // 是否全是 Literal 节点
    let isLiteral = env.TRUE,

    // 静态节点
    staticNodes: string[] = [],

    // 对于 this.a.b[c] 这样的
    // 要还原静态部分 this.a.b 的 raw
    // 虽然 raw 没什么大用吧，谁让我是洁癖呢
    staticRaw = env.EMPTY_STRING,

    // 动态节点
    dynamicNodes: Node[] = []

    array.each(
      nodes,
      function (node) {
        if (isLiteral) {
          if (node.type === nodeType.LITERAL) {
            if ((node as Literal).raw === env.KEYPATH_PARENT) {
              offset += 1
              staticRaw = staticRaw
                ? staticRaw + env.RAW_SLASH + env.KEYPATH_PARENT
                : env.KEYPATH_PARENT
              return
            }
            if ((node as Literal).raw !== env.KEYPATH_CURRENT) {
              const value = toString((node as Literal).value)
              array.push(
                staticNodes,
                value
              )
              if (staticRaw) {
                staticRaw += string.endsWith(staticRaw, env.KEYPATH_PARENT)
                  ? env.RAW_SLASH
                  : env.RAW_DOT
              }
              staticRaw += value
            }
          }
          else {
            isLiteral = env.FALSE
          }
        }

        if (!isLiteral) {
          array.push(
            dynamicNodes,
            node
          )
        }
      }
    )

    // lookup 要求第一位元素是 Identifier，且它的 lookup 是 true 才为 true
    // 其他情况都为 false，如 "11".length 第一位元素是 Literal，不存在向上寻找的需求

    // 优化 1：计算 keypath
    //
    // 计算 keypath 的唯一方式是，第一位元素是 Identifier，后面都是 Literal
    // 否则就表示中间包含动态元素，这会导致无法计算静态路径
    // 如 a.b.c 可以算出 static keypath，而 a[b].c 则不行，因为 b 是动态的

    // 优化 2：计算 offset 并智能转成 Identifier
    //
    // 比如 xx 这样的表达式，应优化成 offset = 2，并转成 Identifier

    // 处理第一个节点
    if (firstNode.type === nodeType.IDENTIFIER) {

      lookup = (firstNode as Identifier).lookup
      offset += (firstNode as Identifier).offset

      let firstName = (firstNode as Identifier).name

      // 不是 KEYPATH_THIS 或 KEYPATH_PARENT
      if (firstName) {
        array.unshift(staticNodes, firstName)
      }

      // 转成 Identifier
      firstName = array.join(staticNodes, env.RAW_DOT)

      // 当 isLiteral 为 false 时
      // 需要为 lead 节点创建合适的 raw
      let firstRaw = (firstNode as Identifier).raw
      if (staticRaw) {
        firstRaw += (
          firstRaw === env.KEYPATH_PARENT
          ? env.RAW_SLASH
          : env.RAW_DOT
        ) + staticRaw
      }

      // a.b.c
      if (isLiteral) {
        firstNode = createIdentifierInner(raw, firstName, lookup, offset)
      }
      // a[b]
      // this.a[b]
      else {
        firstNode = createMemberInner(
          raw,
          createIdentifierInner(firstRaw, firstName, lookup, offset),
          env.UNDEFINED,
          dynamicNodes,
          lookup,
          offset
        )
      }
    }
    else {
      // 例子：
      // "xxx".length
      // format().a.b
      if (isLiteral) {
        firstNode = createMemberInner(
          raw,
          firstNode,
          array.join(staticNodes, env.RAW_DOT),
          env.UNDEFINED,
          lookup,
          offset
        )
      }
      // 例子：
      // "xxx"[length]
      // format()[a]
      else {
        firstNode = createMemberInner(
          raw,
          firstNode,
          env.UNDEFINED,
          dynamicNodes,
          lookup,
          offset
        )
      }
    }

  }

  return firstNode

}

function createIdentifierInner(raw: string, name: string, lookup: boolean, offset: number): Identifier {
  return {
    type: nodeType.IDENTIFIER,
    raw,
    name,
    lookup,
    offset,
  }
}

function createMemberInner(raw: string, lead: Node, keypath: string | void, nodes: Node[] | void, lookup: boolean, offset: number): Member {
  return {
    type: nodeType.MEMBER,
    raw,
    lead,
    keypath,
    nodes,
    lookup,
    offset,
  }
}
