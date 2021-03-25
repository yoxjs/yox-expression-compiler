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
import Keypath from './node/Keypath'
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
  transformIdentifier: (Identifier) => generator.GBase | void,
  renderIdentifier: string,
  renderMemberLiteral: string,
  renderCall: string,
  holder?: boolean,
  stack?: string,
  parentNode?: Node
) {

  let value: generator.GBase,

  isSpecialNode = constant.FALSE,

  generateNode = function (node: Node, parentNode?: Node) {
    return generate(
      node,
      transformIdentifier,
      renderIdentifier,
      renderMemberLiteral,
      renderCall,
      constant.FALSE, // 如果是内部临时值，不需要 holder
      stack,
      parentNode
    )
  },

  generateNodes = function (nodes: Node[], parentNode?: Node) {
    return generator.toArray(
      nodes.map(
        function (node) {
          return generateNode(node, parentNode)
        }
      )
    )
  },

  generateKeypathParams = function (keypath: generator.GBase, keypathNode: Keypath) {

    const params = generator.toObject()

    params.set(
      'name',
       keypath
    )

    if (parentNode && parentNode.type === nodeType.CALL) {
      params.set(
        'call',
        generator.toPrimitive(constant.TRUE)
      )
    }
    if (keypathNode.root === constant.TRUE) {
      params.set(
        'root',
        generator.toPrimitive(constant.TRUE)
      )
    }
    if (keypathNode.lookup === constant.TRUE) {
      params.set(
        'lookup',
        generator.toPrimitive(constant.TRUE)
      )
    }
    if (keypathNode.offset > 0) {
      params.set(
        'offset',
        generator.toPrimitive(keypathNode.offset)
      )
    }
    if (holder) {
      params.set(
        'holder',
        generator.toPrimitive(constant.TRUE)
      )
    }
    if (stack) {
      params.set(
        'stack',
        generator.toRaw(stack)
      )
    }

    return params

  }

  switch (node.type) {

    case nodeType.LITERAL:

      const literalNode = node as Literal

      value = generator.toPrimitive(
        literalNode.value
      )
      break

    case nodeType.UNARY:

      const unaryNode = node as Unary

      value = generator.toUnary(
        unaryNode.operator,
        generateNode(unaryNode.node)
      )
      break

    case nodeType.BINARY:

      const binaryNode = node as Binary,
      left = generateNode(binaryNode.left),
      right = generateNode(binaryNode.right),
      newBinary = generator.toBinary(
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

      value = generator.toTernary(test, yes, no)
      break

    case nodeType.ARRAY:

      const arrayNode = node as ArrayNode

      value = generateNodes(arrayNode.nodes)
      break

    case nodeType.OBJECT:

      const objectNode = node as ObjectNode, newObject = generator.toObject()

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

      const identifierNode = node as Identifier,

      identifierValue = transformIdentifier(identifierNode)

      if (identifierValue) {
        value = identifierValue
      }
      else {
        value = generator.toCall(
          renderIdentifier,
          [
            generateKeypathParams(
              generator.toPrimitive(identifierNode.name),
              identifierNode
            )
          ]
        )
      }
      break

    case nodeType.MEMBER:
      isSpecialNode = constant.TRUE

      const memberNode = node as Member,

      stringifyNodes = generateNodes(memberNode.nodes || [])

      if (memberNode.lead.type === nodeType.IDENTIFIER) {
        // 只能是 a[b] 的形式，因为 a.b 已经在解析时转换成 Identifier 了

        const leadValue = transformIdentifier(memberNode.lead as Identifier)
        if (leadValue) {
          stringifyNodes.join = generator.JOIN_DOT

          value = generator.toCall(
            renderMemberLiteral,
            [
              leadValue,
              stringifyNodes,
              holder
                ? generator.toPrimitive(constant.TRUE)
                : generator.toPrimitive(constant.UNDEFINED)
            ]
          )
        }
        else {
          stringifyNodes.join = generator.JOIN_DOT

          // 避免 this[a]，this 会被解析成空字符串，此时不应加入 stringifyNodes
          const leadName = (memberNode.lead as Identifier).name
          if (leadName) {
            stringifyNodes.unshift(
              generator.toPrimitive(leadName)
            )
          }

          value = generator.toCall(
            renderIdentifier,
            [
              generateKeypathParams(stringifyNodes, memberNode)
            ]
          )
        }

      }
      else if (memberNode.nodes) {
        // "xx"[length]
        // format()[a][b]
        stringifyNodes.join = generator.JOIN_DOT
        value = generator.toCall(
          renderMemberLiteral,
          [
            generateNode(memberNode.lead),
            stringifyNodes,
            holder
              ? generator.toPrimitive(constant.TRUE)
              : generator.toPrimitive(constant.UNDEFINED)
          ]
        )
      }
      else {
        // "xx".length
        // format().a.b
        value = generator.toCall(
          renderMemberLiteral,
          [
            generateNode(memberNode.lead),
            generator.toPrimitive(memberNode.keypath),
            holder
              ? generator.toPrimitive(constant.TRUE)
              : generator.toPrimitive(constant.UNDEFINED)
          ]
        )
      }

      break

    default:
      isSpecialNode = constant.TRUE

      const callNode = node as Call

      value = generator.toCall(
        renderCall,
        [
          generateNode(callNode.name, callNode),
          callNode.args.length
            ? generateNodes(callNode.args)
            : generator.toPrimitive(constant.UNDEFINED),
          holder
            ? generator.toPrimitive(constant.TRUE)
            : generator.toPrimitive(constant.UNDEFINED)
        ]
      )
      break
  }

  if (!holder) {
    return value
  }

  // 最外层的值，且 holder 为 true
  if (isSpecialNode) {
    return value
  }

  const newObject = generator.toObject()
  newObject.set('value', value)

  return newObject

}
