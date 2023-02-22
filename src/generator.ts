import * as constant from 'yox-common/src/util/constant'
import * as generator from 'yox-common/src/util/generator'
import * as array from 'yox-common/src/util/array'

import * as nodeType from './nodeType'

import Node from './node/Node'
import Call from './node/Call'
import Member from './node/Member'
import Literal from './node/Literal'
import Keypath from './node/Keypath'
import Identifier from './node/Identifier'
import Ternary from './node/Ternary'
import Binary from './node/Binary'
import Unary from './node/Unary'

import ArrayNode from './node/Array'
import ObjectNode from './node/Object'

/**
 * 是否需要给 node 加括号，以提升运算优先级
 * 这里不去比较运算符的优先级，而是根据节点类型判断
 * 因为在 compile 环节会根据运算符优先级或括号，创建不同的节点，节点本身已经是优先级的体现了
 *
 * @param node
 */
function needOperatorPrecedence(node: Node): boolean {
  return node.type === nodeType.TERNARY || node.type === nodeType.BINARY
}

export function generate(
  node: Node,
  transformIdentifier: (node: Identifier) => generator.Base | void,
  generateIdentifier: (node: Keypath, nodes: generator.Base[], keypath?: string, holder?: boolean, parentNode?: Node) => generator.Base,
  generateValue: (value: generator.Base, keys: generator.Base[], holder?: boolean) => generator.Base,
  generateCall: (node: Call, fn: generator.Base, args?: generator.Base[], holder?: boolean) => generator.Base,
  holder?: boolean,
  parentNode?: Node
) {

  let value: generator.Base,

  hasHolder = constant.FALSE,

  generateNode = function (node: Node, parentNode?: Node) {
    return generate(
      node,
      transformIdentifier,
      generateIdentifier,
      generateValue,
      generateCall,
      constant.FALSE, // 如果是内部临时值，不需要 holder
      parentNode
    )
  },

  generateNodes = function (nodes: Node[], parentNode?: Node) {
    return nodes.map(
      function (node) {
        return generateNode(node, parentNode)
      }
    )
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

      let binaryNode = node as Binary,
      left = generateNode(binaryNode.left),
      right = generateNode(binaryNode.right)

      value = generator.toBinary(
        needOperatorPrecedence(binaryNode.left)
          ? generator.toPrecedence(left)
          : left,
        binaryNode.operator,
        needOperatorPrecedence(binaryNode.right)
          ? generator.toPrecedence(right)
          : right
      )
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

      value = generator.toList(
        generateNodes(arrayNode.nodes, parentNode)
      )
      break

    case nodeType.OBJECT:

      const objectNode = node as ObjectNode, newObject = generator.toMap()

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
      hasHolder = constant.TRUE

      const identifierNode = node as Identifier

      value = transformIdentifier(identifierNode)
        || generateIdentifier(
            identifierNode,
            identifierNode.name ? generator.parse(identifierNode.name) : [],
            identifierNode.name,
            holder,
            parentNode
          )

      break

    case nodeType.MEMBER:
      hasHolder = constant.TRUE

      const memberNode = node as Member

      if (memberNode.isStatic) {
        // 原样输出
        value = memberNode.raw
      }
      else if (memberNode.lead.type === nodeType.IDENTIFIER) {
        // 只能是 a[b] 的形式，因为 a.b 已经在解析时转换成 Identifier 了
        const leadNode = memberNode.lead as Identifier,
        leadValue = transformIdentifier(leadNode),
        memberNodes = generateNodes(memberNode.nodes || [])

        if (leadValue) {
          value = generateValue(
            leadValue,
            memberNodes,
            holder
          )
        }
        else {
          if (leadNode.name) {
            // a.b.c[d] 这里要把 a.b.c 拆开
            array.each(
              generator.parse(leadNode.name),
              function (node) {
                memberNodes.unshift(node)
              },
              constant.TRUE
            )
          }
          value = generateIdentifier(
            memberNode,
            memberNodes,
            constant.UNDEFINED,
            holder,
            parentNode
          )
        }
      }
      else if (memberNode.nodes) {
        // "xx"[length]
        // format()[a][b]
        value = generateValue(
          generateNode(memberNode.lead),
          generateNodes(memberNode.nodes || []),
          holder
        )
      }
      else {
        // "xx".length
        // format().a.b
        value = generateValue(
          generateNode(memberNode.lead),
          generator.parse(memberNode.keypath as string),
          holder
        )
      }
      break

    default:
      hasHolder = constant.TRUE

      const callNode = node as Call

      value = generateCall(
        callNode,
        generateNode(callNode.name, callNode),
        callNode.args.length
          ? generateNodes(callNode.args)
          : constant.UNDEFINED,
        holder
      )
      break
  }

  if (!holder || hasHolder) {
    return value
  }

  return generator.toMap({
    value,
  })

}
