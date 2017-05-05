
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Unary 节点
 *
 * @param {string} raw
 * @param {string} operator
 * @param {Node} arg
 */
export default class Unary extends Node {

  constructor(raw, operator, arg) {
    super(nodeType.UNARY, raw)
    this.operator = operator
    this.arg = arg
  }

}
