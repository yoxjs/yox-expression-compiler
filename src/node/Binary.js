
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Binary 节点
 *
 * @param {Node} right
 * @param {string} operator
 * @param {Node} left
 */
export default class Binary extends Node {

  constructor(right, operator, left) {
    super(nodeType.BINARY)
    this.left = left
    this.operator = operator
    this.right = right
  }

}

Binary[ Binary.OR = '||' ] = function (a, b) {
  return a || b
}
Binary[Binary.AND = '&&' ] = function (a, b) {
  return a && b
}
Binary[ Binary.SE = '===' ] = function (a, b) {
  return a === b
}
Binary[ Binary.SNE = '!==' ] = function (a, b) {
  return a !== b
}
Binary[ Binary.LE = '==' ] = function (a, b) {
  return a == b
}
Binary[ Binary.LNE = '!=' ] = function (a, b) {
  return a != b
}
Binary[ Binary.LT = '<' ] = function (a, b) {
  return a < b
}
Binary[ Binary.LTE = '<=' ] = function (a, b) {
  return a <= b
}
Binary[ Binary.GT = '>' ] = function (a, b) {
  return a > b
}
Binary[ Binary.GTE = '>=' ] = function (a, b) {
  return a >= b
}
Binary[ Binary.PLUS = '+' ] = function (a, b) {
  return a + b
}
Binary[ Binary.MINUS = '-' ] = function (a, b) {
  return a - b
}
Binary[ Binary.MULTIPLY = '*' ] = function (a, b) {
  return a * b
}
Binary[ Binary.DIVIDE = '/' ] = function (a, b) {
  return a / b
}
Binary[ Binary.MODULO = '%' ] = function (a, b) {
  return a % b
}
