import toJSON from '../../yox-common/src/function/toJSON'

import * as env from '../../yox-common/src/util/env'
import * as array from '../../yox-common/src/util/array'
import * as stringifier from '../../yox-common/src/util/stringify'

import * as nodeType from './nodeType'

import Node from './node/Node'
import Call from './node/Call'
import Member from './node/Member'
import Literal from './node/Literal'
import Identifier from './node/Identifier'
import Ternary from './node/Ternary'
import Binary from './node/Binary'
import Unary from './node/Unary'

import ArrayNode from './node/Array'
import ObjectNode from './node/Object'

export function stringify(
  node: Node,
  renderIdentifier: string,
  renderMemberIdentifier: string,
  renderMemberLiteral: string,
  renderCall: string,
  holder?: boolean,
  depIgnore?: boolean,
  inner?: boolean
) {

  let value: string,

  isSpecialNode = env.FALSE,

  stringifyChildNode = function (node: Node) {
    return stringify(
      node,
      renderIdentifier,
      renderMemberIdentifier,
      renderMemberLiteral,
      renderCall,
      holder,
      depIgnore,
      env.TRUE
    )
  }

  switch (node.type) {

    case nodeType.LITERAL:
      value = toJSON((node as Literal).value)
      break

    case nodeType.UNARY:
      value = (node as Unary).operator + stringifyChildNode((node as Unary).node)
      break

    case nodeType.BINARY:
      value = stringifyChildNode((node as Binary).left)
        + (node as Binary).operator
        + stringifyChildNode((node as Binary).right)
      break

    case nodeType.TERNARY:
      value = stringifyChildNode((node as Ternary).test)
        + '?'
        + stringifyChildNode((node as Ternary).yes)
        + ':'
        + stringifyChildNode((node as Ternary).no)
      break

    case nodeType.ARRAY:
      const items = (node as ArrayNode).nodes.map(stringifyChildNode)
      value = stringifier.toArray(items)
      break

    case nodeType.OBJECT:
      const fields: string[] = []
      array.each(
        (node as ObjectNode).keys,
        function (key: string, index: number) {
          array.push(
            fields,
            toJSON(key)
            + ':'
            + stringifyChildNode((node as ObjectNode).values[index])
          )
        }
      )
      value = stringifier.toObject(fields)
      break

    case nodeType.IDENTIFIER:
      isSpecialNode = env.TRUE

      const identifier = node as Identifier

      value = stringifier.toCall(
        renderIdentifier,
        [
          toJSON(identifier.name),
          holder ? stringifier.TRUE : env.UNDEFINED,
          depIgnore ? stringifier.TRUE : env.UNDEFINED,
          identifier.lookup ? stringifier.TRUE : env.UNDEFINED,
          identifier.offset > 0 ? toJSON(identifier.offset) : env.UNDEFINED
        ]
      )
      break

    case nodeType.MEMBER:
      isSpecialNode = env.TRUE

      const { lead, keypath, nodes, lookup, offset } = node as Member,

      stringifyNodes: string[] = nodes ? nodes.map(stringifyChildNode) : []

      if (lead.type === nodeType.IDENTIFIER) {
        // 只能是 a[b] 的形式，因为 a.b 已经在解析时转换成 Identifier 了
        value = stringifier.toCall(
          renderMemberIdentifier,
          [
            toJSON((lead as Identifier).name),
            stringifier.toArray(stringifyNodes),
            holder ? stringifier.TRUE : env.UNDEFINED,
            depIgnore ? stringifier.TRUE : env.UNDEFINED,
            lookup ? stringifier.TRUE : env.UNDEFINED,
            offset > 0 ? toJSON(offset) : env.UNDEFINED
          ]
        )
      }
      else if (nodes) {
        // "xx"[length]
        // format()[a][b]
        value = stringifier.toCall(
          renderMemberLiteral,
          [
            stringifyChildNode(lead),
            env.UNDEFINED,
            stringifier.toArray(stringifyNodes),
            holder ? stringifier.TRUE : env.UNDEFINED
          ]
        )
      }
      else {
        // "xx".length
        // format().a.b
        value = stringifier.toCall(
          renderMemberLiteral,
          [
            stringifyChildNode(lead),
            toJSON(keypath),
            env.UNDEFINED,
            holder ? stringifier.TRUE : env.UNDEFINED,
          ]
        )
      }

      break

    default:
      isSpecialNode = env.TRUE
      const args = (node as Call).args
      value = stringifier.toCall(
        renderCall,
        [
          stringifyChildNode((node as Call).name),
          args.length
            ? stringifier.toArray(args.map(stringifyChildNode))
            : env.UNDEFINED
        ]
      )
      break
  }

  // 不需要 value holder
  if (!holder) {
    return value
  }

  // 内部的临时值，且 holder 为 true
  if (inner) {
    return isSpecialNode
      ? value + '.value'
      : value
  }

  // 最外层的值，且 holder 为 true
  return isSpecialNode
    ? value
    : stringifier.toObject([`value:${value}`])

}
