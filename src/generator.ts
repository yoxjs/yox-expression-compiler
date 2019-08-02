import * as array from 'yox-common/src/util/array'
import * as constant from 'yox-common/src/util/constant'
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

  isSpecialNode = constant.FALSE,

  // 如果是内部临时值，不需要 holder
  needHolder = holder && !inner,

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
      constant.TRUE
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
      value = generator.toGroup(generateChildNode((node as Binary).left))
        + (node as Binary).operator
        + generator.toGroup(generateChildNode((node as Binary).right))
      break

    case nodeType.TERNARY:
      // 虽然三元表达式优先级最低，但无法保证表达式内部没有 ,
      value = generator.toGroup(generateChildNode((node as Ternary).test))
        + generator.QUESTION
        + generator.toGroup(generateChildNode((node as Ternary).yes))
        + generator.COLON
        + generator.toGroup(generateChildNode((node as Ternary).no))
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
      isSpecialNode = constant.TRUE

      const identifier = node as Identifier

      value = generator.toCall(
        renderIdentifier,
        [
          generator.toString(identifier.name),
          generator.toString(identifier.lookup),
          identifier.offset > 0 ? generator.toString(identifier.offset) : constant.UNDEFINED,
          needHolder ? generator.TRUE : constant.UNDEFINED,
          depIgnore ? generator.TRUE : constant.UNDEFINED,
          stack ? stack : constant.UNDEFINED
        ]
      )
      break

    case nodeType.MEMBER:
      isSpecialNode = constant.TRUE

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
            generator.toString(lookup),
            offset > 0 ? generator.toString(offset) : constant.UNDEFINED,
            needHolder ? generator.TRUE : constant.UNDEFINED,
            depIgnore ? generator.TRUE : constant.UNDEFINED,
            stack ? stack : constant.UNDEFINED
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
            constant.UNDEFINED,
            generator.toArray(stringifyNodes),
            needHolder ? generator.TRUE : constant.UNDEFINED
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
            constant.UNDEFINED,
            needHolder ? generator.TRUE : constant.UNDEFINED,
          ]
        )
      }

      break

    default:
      isSpecialNode = constant.TRUE
      const { args } = node as Call
      value = generator.toCall(
        renderCall,
        [
          generateChildNode((node as Call).name),
          args.length
            ? generator.toArray(args.map(generateChildNode))
            : constant.UNDEFINED,
          needHolder ? generator.TRUE : constant.UNDEFINED
        ]
      )
      break
  }

  if (!needHolder) {
    return value
  }

  // 最外层的值，且 holder 为 true
  return isSpecialNode
    ? value
    : generator.toObject([
        constant.RAW_VALUE + generator.COLON + value
      ])

}
