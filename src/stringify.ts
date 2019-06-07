import toJSON from '../../yox-common/src/function/toJSON'

import * as env from '../../yox-common/src/util/env'
import * as array from '../../yox-common/src/util/array'
import * as keypathUtil from '../../yox-common/src/util/keypath'
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
    return stringify(node, renderIdentifier, renderMemberIdentifier, renderMemberLiteral, renderCall, holder, depIgnore, env.TRUE)
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
          depIgnore ? stringifier.TRUE : env.UNDEFINED,
          identifier.lookup ? stringifier.TRUE : env.UNDEFINED,
          identifier.offset > 0 ? toJSON(identifier.offset) : env.UNDEFINED
        ]
      )
      break

    case nodeType.MEMBER:
      isSpecialNode = env.TRUE

      const { props, lookup, offset } = node as Member,

      // 第一个节点先弹出来，放在最后处理
      firstNode = props.shift() as Node

      // 处理剩下的 props
      // 这里要做两手准备：
      // 1. 如果全是 literal 节点，则编译时 join
      // 2. 如果不全是 literal 节点，则运行时 join

      let isLiteral = env.TRUE, staticNodes: string[] = [], runtimeNodes: string[] = []
      array.each(
        props,
        function (node) {
          if (node.type === nodeType.LITERAL) {
            array.push(
              staticNodes,
              (node as Literal).value
            )
          }
          else {
            isLiteral = env.FALSE
          }
          array.push(
            runtimeNodes,
            stringifyChildNode(node)
          )
        }
      )

      // 处理第一个节点
      if (firstNode.type === nodeType.IDENTIFIER) {
        const name = (firstNode as Identifier).name
        // a.b.c
        if (isLiteral) {
          array.unshift(staticNodes, name)
          value = stringifier.toCall(
            renderIdentifier,
            [
              toJSON(array.join(staticNodes, keypathUtil.separator)),
              depIgnore ? stringifier.TRUE : env.UNDEFINED,
              lookup ? stringifier.TRUE : env.UNDEFINED,
              offset > 0 ? toJSON(offset) : env.UNDEFINED
            ]
          )
        }
        // a[b]
        else {
          value = stringifier.toCall(
            renderMemberIdentifier,
            [
              toJSON(name),
              stringifier.toArray(runtimeNodes),
              depIgnore ? stringifier.TRUE : env.UNDEFINED,
              lookup ? stringifier.TRUE : env.UNDEFINED,
              offset > 0 ? toJSON(offset) : env.UNDEFINED
            ]
          )
        }
      }
      else {
        // "xxx".length
        value = stringifier.toCall(
          renderMemberLiteral,
          [
            stringifyChildNode(firstNode),
            isLiteral ? toJSON(array.join(staticNodes, keypathUtil.separator)) : env.UNDEFINED,
            isLiteral ? env.UNDEFINED : stringifier.toArray(runtimeNodes),
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

  // 内部的临时值，不需要 value holder
  if (inner || !holder) {
    return isSpecialNode
      ? value + '.value'
      : value
  }

  // 最外层的值，需要 value holder
  return isSpecialNode
    ? value
    : stringifier.toObject([`value:${value}`])

}
