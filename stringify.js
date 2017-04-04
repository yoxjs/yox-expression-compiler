
import * as is from 'yox-common/util/is'
import * as char from 'yox-common/util/char'
import * as object from 'yox-common/util/object'

import * as nodeType from './src/nodeType'

import MemberNode from './src/node/Member'

/**
 * 序列化表达式
 *
 * @param {Node} node
 * @return {string}
 */
export default function stringify(node) {

  let recursion = function (node) {
    return stringify(node)
  }

  switch (node.type) {
    case nodeType.ARRAY:
      return `[${node.elements.map(recursion).join(char.CHAR_COMMA)}]`

    case nodeType.BINARY:
      return `${stringify(node.left)} ${node.operator} ${stringify(node.right)}`

    case nodeType.CALL:
      return `${stringify(node.callee)}(${node.args.map(recursion).join(char.CHAR_COMMA)})`

    case nodeType.TERNARY:
      return `${stringify(node.test)} ? ${stringify(node.consequent)} : ${stringify(node.alternate)}`

    case nodeType.IDENTIFIER:
      return node.name

    case nodeType.LITERAL:
      return object.has(node, 'raw')
        ? node.raw
        : node.value

    case nodeType.MEMBER:
      return MemberNode.flatten(node)
        .map(
          function (node, index) {
            if (node.type === nodeType.LITERAL) {
              let { value } = node
              return is.numeric(value)
                ? `${char.CHAR_OBRACK}${value}${char.CHAR_CBRACK}`
                : `${char.CHAR_DOT}${value}`
            }
            else {
              node = stringify(node)
              return index > 0
                ? `${char.CHAR_OBRACK}${node}${char.CHAR_CBRACK}`
                : node
            }
          }
        )
        .join(char.CHAR_BLANK)

    case nodeType.UNARY:
      return `${node.operator}${stringify(node.arg)}`

    default:
      return char.CHAR_BLANK
  }

}
