
import Node from './Node'
import * as nodeType from '../nodeType'
import * as operator from '../operator'

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
    this.right = right
    this.operator = operator
    this.left = left
  }

}

Binary[ operator.OR ] = function (a, b) {
  return a || b
}
Binary[ operator.AND ] = function (a, b) {
  return a && b
}
Binary[ operator.SE ] = function (a, b) {
  return a === b
}
Binary[ operator.SNE ] = function (a, b) {
  return a !== b
}
Binary[ operator.LE ] = function (a, b) {
  return a == b
}
Binary[ operator.LNE ] = function (a, b) {
  return a != b
}
Binary[ operator.LT ] = function (a, b) {
  return a < b
}
Binary[ operator.LTE ] = function (a, b) {
  return a <= b
}
Binary[ operator.GT ] = function (a, b) {
  return a > b
}
Binary[ operator.GTE ] = function (a, b) {
  return a >= b
}
Binary[ operator.PLUS ] = function (a, b) {
  return a + b
}
Binary[ operator.MINUS ] = function (a, b) {
  return a - b
}
Binary[ operator.MULTIPLY ] = function (a, b) {
  return a * b
}
Binary[ operator.DIVIDE ] = function (a, b) {
  return a / b
}
Binary[ operator.MODULO ] = function (a, b) {
  return a % b
}
