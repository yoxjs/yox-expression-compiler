import * as constant from 'yox-common/src/util/constant'
import * as generator from 'yox-common/src/util/generator'
import * as array from 'yox-common/src/util/array'

import * as nodeType from './nodeType'
import * as interpreter from './interpreter'

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

/**
 * 比较操作符优先级
 *
 * @param node
 * @param operator
 */
function compareOperatorPrecedence(node: Node, operator: string): number {
  // 三元表达式优先级最低
  if (node.type === nodeType.TERNARY) {
    return -1
  }
  // 二元运算要比较优先级
  if (node.type === nodeType.BINARY) {
    return interpreter.binary[(node as Binary).operator] - interpreter.binary[operator]
  }
  return 0
}

export function generate(
  node: Node,
  renderIdentifier: string,
  renderMemberKeypath: string,
  renderMemberLiteral: string,
  renderCall: string,
  holder?: boolean,
  stack?: string,
  inner?: boolean
) {

  let value: generator.GBase,

  isSpecialNode = constant.FALSE,

  // 如果是内部临时值，不需要 holder
  needHolder = holder && !inner,

  generateNode = function (node: Node) {
    return generate(
      node,
      renderIdentifier,
      renderMemberKeypath,
      renderMemberLiteral,
      renderCall,
      holder,
      stack,
      constant.TRUE
    )
  },

  generateNodes = function (nodes: Node[]) {
    return new generator.GArray(
      nodes.map(generateNode)
    )
  }

  switch (node.type) {

    case nodeType.LITERAL:

      const literalNode = node as Literal

      value = new generator.GPrimitive(
        literalNode.value
      )
      break

    case nodeType.UNARY:

      const unaryNode = node as Unary

      value = new generator.GUnary(
        unaryNode.operator,
        generateNode(unaryNode.node)
      )
      break

    case nodeType.BINARY:

      const binaryNode = node as Binary,
      left = generateNode(binaryNode.left),
      right = generateNode(binaryNode.right),
      newBinary = new generator.GBinary(
        left,
        binaryNode.operator,
        right
      )

      if (compareOperatorPrecedence(binaryNode.left, binaryNode.operator) < 0) {
        newBinary.leftGroup = constant.TRUE
      }
      if (compareOperatorPrecedence(binaryNode.right, binaryNode.operator) < 0) {
        newBinary.rightGroup = constant.TRUE
      }

      value = newBinary
      break

    case nodeType.TERNARY:

      const ternaryNode = node as Ternary,
      test = generateNode(ternaryNode.test),
      yes = generateNode(ternaryNode.yes),
      no = generateNode(ternaryNode.no)

      value = new generator.GTernary(test, yes, no)
      break

    case nodeType.ARRAY:

      const arrayNode = node as ArrayNode

      value = generateNodes(arrayNode.nodes)
      break

    case nodeType.OBJECT:

      const objectNode = node as ObjectNode, newObject = new generator.GObject()

      array.each(
        objectNode.keys,
        function (key, index) {
          const value = objectNode.values[index]
          newObject.set(key, generateNode(value))
        }
      )

      value = newObject
      break

    case nodeType.IDENTIFIER:
      isSpecialNode = constant.TRUE

      const identifierNode = node as Identifier

      value = new generator.GCall(
        renderIdentifier,
        [
          new generator.GPrimitive(identifierNode.name),
          new generator.GPrimitive(identifierNode.lookup),
          identifierNode.offset > 0
            ? new generator.GPrimitive(identifierNode.offset)
            : generator.GRAW_UNDEFINED,
          needHolder
            ? generator.GRAW_TRUE
            : generator.GRAW_UNDEFINED,
          stack
            ? new generator.GRaw(stack)
            : generator.GRAW_UNDEFINED
        ]
      )
      break

    case nodeType.MEMBER:
      isSpecialNode = constant.TRUE

      const memberNode = node as Member,

      stringifyNodes = generateNodes(memberNode.nodes || [])

      if (memberNode.lead.type === nodeType.IDENTIFIER) {
        // 只能是 a[b] 的形式，因为 a.b 已经在解析时转换成 Identifier 了
        value = new generator.GCall(
          renderIdentifier,
          [
            new generator.GCall(
              renderMemberKeypath,
              [
                new generator.GPrimitive((memberNode.lead as Identifier).name),
                stringifyNodes
              ]
            ),
            new generator.GPrimitive(memberNode.lookup),
            memberNode.offset > 0
              ? new generator.GPrimitive(memberNode.offset)
              : generator.GRAW_UNDEFINED,
            needHolder
              ? generator.GRAW_TRUE
              : generator.GRAW_UNDEFINED,
            stack
              ? new generator.GRaw(stack)
              : generator.GRAW_UNDEFINED
          ]
        )
      }
      else if (memberNode.nodes) {
        // "xx"[length]
        // format()[a][b]
        value = new generator.GCall(
          renderMemberLiteral,
          [
            generateNode(memberNode.lead),
            generator.GRAW_UNDEFINED,
            stringifyNodes,
            needHolder
              ? generator.GRAW_TRUE
              : generator.GRAW_UNDEFINED
          ]
        )
      }
      else {
        // "xx".length
        // format().a.b
        value = new generator.GCall(
          renderMemberLiteral,
          [
            generateNode(memberNode.lead),
            new generator.GPrimitive(memberNode.keypath),
            generator.GRAW_UNDEFINED,
            needHolder
              ? generator.GRAW_TRUE
              : generator.GRAW_UNDEFINED
          ]
        )
      }

      break

    default:
      isSpecialNode = constant.TRUE

      const callNode = node as Call

      value = new generator.GCall(
        renderCall,
        [
          generateNode(callNode.name),
          callNode.args.length
            ? generateNodes(callNode.args)
            : generator.GRAW_UNDEFINED,
          needHolder
            ? generator.GRAW_TRUE
            : generator.GRAW_UNDEFINED
        ]
      )
      break
  }

  if (!needHolder) {
    return value
  }

  // 最外层的值，且 holder 为 true
  if (isSpecialNode) {
    return value
  }

  const newObject = new generator.GObject()
  newObject.set(constant.RAW_VALUE, value)

  return newObject

}
