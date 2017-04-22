
import Node from './Node'
import * as nodeType from '../nodeType'
import * as operator from '../operator'

/**
 * Binary 节点
 *
 * @param {Node} left
 * @param {string} operator
 * @param {Node} right
 */
export default class Binary extends Node {

  constructor(source, left, operator, right) {
    super(nodeType.BINARY, source)
    this.left = left
    this.operator = operator
    this.right = right
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
