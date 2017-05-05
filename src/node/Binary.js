
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Binary 节点
 *
 * @param {string} raw
 * @param {Node} left
 * @param {string} operator
 * @param {Node} right
 */
export default class Binary extends Node {

  constructor(raw, left, operator, right) {
    super(nodeType.BINARY, raw)
    this.left = left
    this.operator = operator
    this.right = right
  }

}
