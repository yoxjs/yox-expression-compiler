
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Ternary 节点
 *
 * @param {string} raw
 * @param {Node} test
 * @param {Node} yes
 * @param {Node} no
 */
export default class Ternary extends Node {

  constructor(raw, test, yes, no) {
    super(nodeType.TERNARY, raw)
    this.test = test
    this.yes = yes
    this.no = no
  }

}
