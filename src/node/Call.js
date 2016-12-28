
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Call 节点
 *
 * @param {Node} callee
 * @param {Array.<Node>} args
 */
export default class Call extends Node {

  constructor(callee, args) {
    super(nodeType.CALL)
    this.callee = callee
    this.args = args
  }

}
