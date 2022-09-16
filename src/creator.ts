import { SLOT_DATA_PREFIX } from 'yox-config/src/config'

import toString from 'yox-common/src/function/toString'

import * as array from 'yox-common/src/util/array'
import * as string from 'yox-common/src/util/string'
import * as constant from 'yox-common/src/util/constant'

import * as helper from './helper'
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
    isStatic: isStaticNodes(nodes),
  }
}

export function createBinary(left: Node, operator: string, right: Node, raw: string): Binary {
  return {
    type: nodeType.BINARY,
    raw,
    left,
    operator,
    right,
    isStatic: isStaticNodes([left, right]),
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

  let root = constant.FALSE, lookup = constant.TRUE, offset = 0

  if (name === constant.KEYPATH_CURRENT) {
    name = constant.EMPTY_STRING
    lookup = constant.FALSE
  }
  else if (name === constant.KEYPATH_PARENT) {
    name = constant.EMPTY_STRING
    lookup = constant.FALSE
    offset = 1
  }
  else if (name === constant.KEYPATH_ROOT) {
    name = constant.EMPTY_STRING
    root = constant.TRUE
    lookup = constant.FALSE
  }
  else {
    name = replaceSlotIdentifierIfNeeded(name)
  }

  // 对象属性需要区分 a.b 和 a[b]
  // 如果不借用 Literal 无法实现这个判断
  // 同理，如果用了这种方式，就无法区分 a.b 和 a['b']，但是无所谓，这两种表示法本就一个意思

  return isProp
    ? createLiteral(name, raw)
    : createIdentifierInner(raw, name, root, lookup, offset)

}

export function createLiteral(value: any, raw: string): Literal {
  return {
    type: nodeType.LITERAL,
    raw,
    value,
    isStatic: constant.TRUE,
  }
}

export function createObject(keys: string[], values: Node[], raw: string): ObjectNode {
  return {
    type: nodeType.OBJECT,
    raw,
    keys,
    values,
    isStatic: isStaticNodes(values),
  }
}

export function createTernary(test: Node, yes: Node, no: Node, raw: string): Ternary {
  return {
    type: nodeType.TERNARY,
    raw,
    test,
    yes,
    no,
    isStatic: isStaticNodes([test, yes, no]),
  }
}

export function createUnary(operator: string, node: Node, raw: string): Unary {
  return {
    type: nodeType.UNARY,
    raw,
    operator,
    node,
    isStatic: node.isStatic,
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

  // 是否直接从顶层查找
  root = constant.FALSE,

  // 是否向上查找
  lookup = constant.TRUE,

  // 偏移量，默认从当前 context 开始查找
  offset = 0

  // 表示传入的 nodes 至少有两个节点（弹出了一个）
  if (nodes.length > 0) {

    // 处理剩下的 nodes
    // 这里要做两手准备：
    // 1. 如果全是 literal 节点，则编译时 join
    // 2. 如果不全是 literal 节点，则运行时 join

    // 是否全是 Literal 节点
    let isLiteral = constant.TRUE,

    // 静态节点
    staticNodes: string[] = [],

    // 对于 this.a.b[c] 这样的
    // 要还原静态部分 this.a.b 的 raw
    // 虽然 raw 没什么大用吧，谁让我是洁癖呢
    staticRaw = constant.EMPTY_STRING,

    // 动态节点
    dynamicNodes: Node[] = []

    array.each(
      nodes,
      function (node) {
        if (isLiteral) {
          if (node.type === nodeType.LITERAL) {
            const literalNode = node as Literal
            if (literalNode.raw === constant.KEYPATH_PARENT) {
              offset += 1
              staticRaw = staticRaw
                ? staticRaw + constant.RAW_SLASH + constant.KEYPATH_PARENT
                : constant.KEYPATH_PARENT
              return
            }
            if (literalNode.raw !== constant.KEYPATH_CURRENT) {
              const value = toString(literalNode.value)
              array.push(
                staticNodes,
                value
              )
              if (staticRaw) {
                staticRaw += string.endsWith(staticRaw, constant.KEYPATH_PARENT)
                  ? constant.RAW_SLASH
                  : constant.RAW_DOT
              }
              staticRaw += value
            }
          }
          else {
            isLiteral = constant.FALSE
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

      const identifierNode = firstNode as Identifier

      root = identifierNode.root
      lookup = identifierNode.lookup
      offset += identifierNode.offset

      let firstName = identifierNode.name

      // 不是 KEYPATH_THIS 或 KEYPATH_PARENT 或 KEYPATH_ROOT
      if (firstName) {
        firstName = replaceSlotIdentifierIfNeeded(firstName, identifierNode)
        array.unshift(staticNodes, firstName)
      }

      // 转成 Identifier
      firstName = array.join(staticNodes, constant.RAW_DOT)

      // a.b.c
      if (isLiteral) {
        firstNode = createIdentifierInner(raw, firstName, root, lookup, offset, staticNodes)
      }
      // a[b]
      // this.a[b]
      else {

        // 当 isLiteral 为 false 时
        // 需要为 lead 节点创建合适的 raw
        let firstRaw = identifierNode.raw

        if (staticRaw) {
          // 确定 firstNode 和后续静态节点的连接字符
          let separator = constant.RAW_DOT

          if (firstRaw === constant.KEYPATH_ROOT
            || firstRaw === constant.KEYPATH_PARENT
          ) {
            separator = constant.RAW_SLASH
          }

          firstRaw += separator + staticRaw
        }

        firstNode = createMemberInner(
          raw,
          createIdentifierInner(firstRaw, firstName, root, lookup, offset, staticNodes),
          constant.UNDEFINED,
          dynamicNodes,
          root,
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
          array.join(staticNodes, constant.RAW_DOT),
          constant.UNDEFINED,
          root,
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
          constant.UNDEFINED,
          dynamicNodes,
          root,
          lookup,
          offset
        )
      }
    }

  }

  return firstNode

}

function createIdentifierInner(raw: string, name: string, root: boolean, lookup: boolean, offset: number, literals?: string[]): Identifier {
  return {
    type: nodeType.IDENTIFIER,
    raw,
    name,
    root,
    lookup,
    offset,
    literals: literals && literals.length > 1 ? literals : constant.UNDEFINED,
  }
}

function createMemberInner(raw: string, lead: Node, keypath: string | void, nodes: Node[] | void, root: boolean, lookup: boolean, offset: number): Member {
  return {
    type: nodeType.MEMBER,
    raw,
    lead,
    keypath,
    nodes,
    root,
    lookup,
    offset,
    isStatic: lead.isStatic && (!nodes || isStaticNodes(nodes)),
  }
}

function replaceSlotIdentifierIfNeeded(name: string, identifierNode?: Identifier): string {
  // 如果是插槽变量，则进行替换
  if (helper.isSlotIdentifierStart(string.codeAt(name, 0))) {
    name = SLOT_DATA_PREFIX + string.slice(name, 1)
    if (identifierNode) {
      identifierNode.name = name
    }
  }
  return name
}

function isStaticNodes(nodes: Node[]) {
  let isStatic = constant.TRUE
  array.each(
    nodes,
    function (node) {
      if (!node.isStatic) {
        return isStatic = constant.FALSE
      }
    }
  )
  return isStatic
}