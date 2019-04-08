import * as is from 'yox-common/util/is'
import * as env from 'yox-common/util/env'
import * as object from 'yox-common/util/object'
import * as keypathUtil from 'yox-common/util/keypath'

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

/**
 * 对外和对内的路径表示法不同
 */
const keypathNames = {}

keypathNames[env.KEYPATH_PUBLIC_CURRENT] = env.KEYPATH_PRIVATE_CURRENT
keypathNames[env.KEYPATH_PUBLIC_PARENT] = env.KEYPATH_PRIVATE_PARENT

export function createArray(elements: Node[], raw: string): ArrayNode {
  return {
    type: nodeType.ARRAY,
    raw,
    elements,
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

export function createUnary(operator: string, arg: Node, raw: string): Unary {
  return {
    type: nodeType.UNARY,
    raw,
    operator,
    arg
  }
}

export function createBinary(left: Node, operator: string, right: Node, raw: string): Binary {
  return {
    type: nodeType.BINARY,
    raw,
    left,
    operator,
    right
  }
}

export function createTernary(test: Node, yes: Node, no: Node, raw: string): Ternary {
  return {
    type: nodeType.TERNARY,
    raw,
    test,
    yes,
    no
  }
}

export function createCall(callee: Node, args: Node[], raw: string): Call {
  return {
    type: nodeType.CALL,
    raw,
    callee,
    args,
  }
}

export function createLiteral(value: any, raw: string): Literal {
  return {
    type: nodeType.LITERAL,
    raw,
    value,
  }
}

export function createIdentifier(raw: string, name: string, isProp = env.FALSE): Identifier | Literal {

  let lookup = env.TRUE

  // public -> private
  if (object.has(keypathNames, name)) {
    name = keypathNames[name]
    lookup = env.FALSE
  }

  // 对象属性需要区分 a.b 和 a[b]
  // 如果不借用 Literal 无法实现这个判断
  // 同理，如果用了这种方式，就无法区分 a.b 和 a['b']，但是无所谓，这两种表示法本就一个意思

  return isProp
    ? createLiteral(name, raw)
    : {
        type: nodeType.IDENTIFIER,
        raw,
        name,
        lookup,
        staticKeypath: name
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
export function createMemberIfNeeded(raw: string, nodes: Node[]): Node | Member {

  // lookup 要求第一位元素是 Identifier 或 nodeType.MEMBER，且它的 lookup 是 true，才为 true
  // 其他情况都为 false，如 "11".length 第一位元素是 Literal，不存在向上寻找的需求
  let first = nodes[0], length = nodes[env.RAW_LENGTH], lookup = env.FALSE, staticKeypath: string | void, value: any

  if (first.type === nodeType.IDENTIFIER
    || first.type === nodeType.MEMBER
  ) {
    lookup = (first as Identifier).lookup
    staticKeypath = (first as Identifier).staticKeypath
  }

  // 算出 staticKeypath 的唯一方式是，第一位元素是 Identifier，后面都是 Literal
  // 否则就表示中间包含动态元素，这会导致无法计算静态路径
  // 如 a.b.c 可以算出 staticKeypath，而 a[b].c 则不行，因为 b 是动态的
  // 这段属于性能优化，避免在运行时反复计算 Member 的 keypath
  if (is.string(staticKeypath)) {
    for (let i = 1; i < length; i++) {
      if (nodes[i].type === nodeType.LITERAL) {
        value = (nodes[i] as Literal).value
        if (is.string(value) || is.number(value)) {
          staticKeypath = keypathUtil.join(staticKeypath as string, value)
          continue
        }
      }
      staticKeypath = env.UNDEFINED
      break
    }
  }

  return length > 1
    ? {
        type: nodeType.MEMBER,
        raw,
        lookup,
        staticKeypath,
        props: object.copy(nodes)
      }
    : first
}
