import isDef from 'yox-common/src/function/isDef'
import toString from 'yox-common/src/function/toString'

import * as env from 'yox-common/src/util/env'
import * as array from 'yox-common/src/util/array'
import * as keypathUtil from 'yox-common/src/util/keypath'

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

export function createBinary(a: Node, op: string, b: Node, raw: string): Binary {
  return {
    type: nodeType.BINARY,
    raw,
    a,
    op,
    b,
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

function createIdentifierInner(raw: string, name: string, lookup: boolean | void, offset: number | void, sk: string | void): Identifier {
  return {
    type: nodeType.IDENTIFIER,
    raw,
    name,
    lookup: lookup === env.FALSE ? lookup : env.UNDEFINED,
    offset: offset > 0 ? offset : env.UNDEFINED,
    sk: isDef(sk) ? sk as string : name,
  }
}

function createMemberInner(raw: string, props: Node[], lookup: boolean | void, offset: number, sk: string | void) {
  return {
    type: nodeType.MEMBER,
    raw,
    props,
    lookup: lookup === env.FALSE ? lookup : env.UNDEFINED,
    offset: offset > 0 ? offset : env.UNDEFINED,
    sk,
  }
}

export function createIdentifier(raw: string, name: string, isProp?: boolean): Identifier | Literal {

  let lookup: boolean | void, offset: number | void

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

export function createUnary(op: string, a: Node, raw: string): Unary {
  return {
    type: nodeType.UNARY,
    raw,
    op,
    a,
  }
}

function getLiteralNode(nodes: Node[], index: number): Literal | void {
  if (nodes[index]
    && nodes[index].type === nodeType.LITERAL
  ) {
    return nodes[index] as Literal
  }
}

/**
 * 通过判断 nodes 来决定是否需要创建 Member
 *
 * 创建 Member 至少需要 nodes 有两个元素
 *
 * nodes 元素类型没有限制，可以是 Identifier、Literal、Call，或是别的完整表达式
 *
 * @param raw
 * @param nodes
 */
export function createMemberIfNeeded(raw: string, nodes: (Node | Identifier | Literal)[]): Node | Identifier | Member {

  let { length } = nodes,

  lookup: boolean | void,

  offset = 0,

  staticKeypath: string | void,

  name = env.EMPTY_STRING,

  list: (Node | Identifier | Literal)[] = [],

  literal: Literal | void,

  identifier: Identifier

  if (length > 1) {

    // lookup 要求第一位元素是 Identifier，且它的 lookup 是 true 才为 true
    // 其他情况都为 false，如 "11".length 第一位元素是 Literal，不存在向上寻找的需求
    if (nodes[0].type === nodeType.IDENTIFIER) {

      identifier = nodes[0] as Identifier

      name = identifier.name
      lookup = identifier.lookup
      staticKeypath = identifier.sk

      if (identifier.offset > 0) {
        offset += identifier.offset as number
      }

      if (name) {
        array.push(list, identifier)
      }

      // 优化 1：计算 staticKeypath
      //
      // 计算 staticKeypath 的唯一方式是，第一位元素是 Identifier，后面都是 Literal
      // 否则就表示中间包含动态元素，这会导致无法计算静态路径
      // 如 a.b.c 可以算出 staticKeypath，而 a[b].c 则不行，因为 b 是动态的
      // 下面这段属于性能优化，避免在运行时反复计算 Member 的 keypath

      // 优化 2：计算 offset 并智能转成 Identifier
      //
      // 比如 ../../xx 这样的表达式，应优化成 offset = 2，并转成 Identifier

      for (let i = 1; i < length; i++) {
        literal = getLiteralNode(nodes, i)
        if (literal) {
          if (literal.raw === env.KEYPATH_PARENT) {
            offset += 1
            continue
          }
          if (isDef(staticKeypath)
            && literal.raw !== env.KEYPATH_CURRENT
          ) {
            staticKeypath = keypathUtil.join(staticKeypath as string, toString(literal.value))
          }
        }
        else {
          staticKeypath = env.UNDEFINED
        }
        array.push(list, nodes[i])
      }

      // 表示 nodes 中包含路径，并且路径节点被干掉了
      if (list.length < length) {
        nodes = list
        // 剩下的节点，第一个如果是 Literal，把它转成 Identifier
        literal = getLiteralNode(nodes, 0)
        if (literal) {
          name = literal.value
          nodes[0] = createIdentifierInner(literal.raw, name, lookup, offset)
        }
      }

    }

    // 如果全是路径节点，如 ../../this，nodes 为空数组
    // 如果剩下一个节点，则可转成标识符
    return nodes.length < 2
      ? createIdentifierInner(raw, name, lookup, offset, staticKeypath)
      : createMemberInner(raw, nodes, lookup, offset, staticKeypath)

  }

  return nodes[0]

}
