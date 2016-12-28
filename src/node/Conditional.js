
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Conditional 节点
 *
 * @param {Node} test
 * @param {Node} consequent
 * @param {Node} alternate
 */
export default class Conditional extends Node {

  constructor(test, consequent, alternate) {
    super(nodeType.CONDITIONAL)
    this.test = test
    this.consequent = consequent
    this.alternate = alternate
  }

}
