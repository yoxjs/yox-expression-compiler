
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Unary 节点
 *
 * @param {string} operator
 * @param {Node} arg
 */
export default class Unary extends Node {

  constructor(operator, arg) {
    super(nodeType.UNARY)
    this.operator = operator
    this.arg = arg
  }

}

Unary[ Unary.PLUS = '+' ] = function (value) {
  return +value
}
Unary[ Unary.MINUS = '-' ] = function (value) {
  return -value
}
Unary[ Unary.BANG = '!' ] = function (value) {
  return !value
}
Unary[ Unary.WAVE = '~' ] = function (value) {
  return ~value
}
