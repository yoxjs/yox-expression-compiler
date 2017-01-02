
import Node from './Node'
import * as nodeType from '../nodeType'
import * as operator from '../operator'

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

Unary[ operator.PLUS ] = function (value) {
  return +value
}
Unary[ operator.MINUS ] = function (value) {
  return -value
}
Unary[ operator.NOT ] = function (value) {
  return !value
}
Unary[ operator.WAVE ] = function (value) {
  return ~value
}
Unary[ operator.BOOLEAN ] = function (value) {
  return !!value
}
