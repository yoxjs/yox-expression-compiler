import * as env from 'yox-common/src/util/env'
import * as array from 'yox-common/src/util/array'
import * as generator from 'yox-common/src/util/generator'

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

export function generate(
  node: Node,
  renderIdentifier: string,
  renderMemberKeypath: string,
  renderMemberLiteral: string,
  renderCall: string,
  holder?: boolean,
  depIgnore?: boolean,
  stack?: string,
  inner?: boolean
) {

  let value: string,

  isSpecialNode = env.FALSE,

  generateChildNode = function (node: Node) {
    return generate(
      node,
      renderIdentifier,
      renderMemberKeypath,
      renderMemberLiteral,
      renderCall,
      holder,
      depIgnore,
      stack,
      env.TRUE
    )
  }

  switch (node.type) {

    case nodeType.LITERAL:
      value = generator.toString((node as Literal).value)
      break

    case nodeType.UNARY:
      value = (node as Unary).operator + generateChildNode((node as Unary).node)
      break

    case nodeType.BINARY:
      value = generateChildNode((node as Binary).left)
        + (node as Binary).operator
        + generateChildNode((node as Binary).right)
      break

    case nodeType.TERNARY:
      value = generateChildNode((node as Ternary).test)
        + generator.QUESTION
        + generateChildNode((node as Ternary).yes)
        + generator.COLON
        + generateChildNode((node as Ternary).no)
      break

    case nodeType.ARRAY:
      const items = (node as ArrayNode).nodes.map(generateChildNode)
      value = generator.toArray(items)
      break

    case nodeType.OBJECT:
      const fields: string[] = []
      array.each(
        (node as ObjectNode).keys,
        function (key: string, index: number) {
          array.push(
            fields,
            generator.toString(key)
            + generator.COLON
            + generateChildNode((node as ObjectNode).values[index])
          )
        }
      )
      value = generator.toObject(fields)
      break

    case nodeType.IDENTIFIER:
      isSpecialNode = env.TRUE

      const identifier = node as Identifier

      value = generator.toCall(
        renderIdentifier,
        [
          generator.toString(identifier.name),
          identifier.lookup ? generator.TRUE : env.UNDEFINED,
          identifier.offset > 0 ? generator.toString(identifier.offset) : env.UNDEFINED,
          holder ? generator.TRUE : env.UNDEFINED,
          depIgnore ? generator.TRUE : env.UNDEFINED,
          stack ? stack : env.UNDEFINED
        ]
      )
      break

    case nodeType.MEMBER:
      isSpecialNode = env.TRUE

      const { lead, keypath, nodes, lookup, offset } = node as Member,

      stringifyNodes: string[] = nodes ? nodes.map(generateChildNode) : []

      if (lead.type === nodeType.IDENTIFIER) {
        // 只能是 a[b] 的形式，因为 a.b 已经在解析时转换成 Identifier 了
        value = generator.toCall(
          renderIdentifier,
          [
            generator.toCall(
              renderMemberKeypath,
              [
                generator.toString((lead as Identifier).name),
                generator.toArray(stringifyNodes)
              ]
            ),
            lookup ? generator.TRUE : env.UNDEFINED,
            offset > 0 ? generator.toString(offset) : env.UNDEFINED,
            holder ? generator.TRUE : env.UNDEFINED,
            depIgnore ? generator.TRUE : env.UNDEFINED,
            stack ? stack : env.UNDEFINED
          ]
        )
      }
      else if (nodes) {
        // "xx"[length]
        // format()[a][b]
        value = generator.toCall(
          renderMemberLiteral,
          [
            generateChildNode(lead),
            env.UNDEFINED,
            generator.toArray(stringifyNodes),
            holder ? generator.TRUE : env.UNDEFINED
          ]
        )
      }
      else {
        // "xx".length
        // format().a.b
        value = generator.toCall(
          renderMemberLiteral,
          [
            generateChildNode(lead),
            generator.toString(keypath),
            env.UNDEFINED,
            holder ? generator.TRUE : env.UNDEFINED,
          ]
        )
      }

      break

    default:
      isSpecialNode = env.TRUE
      const { args } = node as Call
      value = generator.toCall(
        renderCall,
        [
          generateChildNode((node as Call).name),
          args.length
            ? generator.toArray(args.map(generateChildNode))
            : env.UNDEFINED,
          holder ? generator.TRUE : env.UNDEFINED
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
      ? value + env.RAW_DOT + env.RAW_VALUE
      : value
  }

  // 最外层的值，且 holder 为 true
  return isSpecialNode
    ? value
    : generator.toObject([env.RAW_VALUE + generator.COLON + value])

}
