
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Ternary 节点
 *
 * @param {Node} test
 * @param {Node} consequent
 * @param {Node} alternate
 */
export default class Ternary extends Node {

  constructor(test, consequent, alternate) {
    super(nodeType.TERNARY)
    this.test = test
    this.consequent = consequent
    this.alternate = alternate
  }

}
