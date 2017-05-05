
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Call 节点
 *
 * @param {string} raw
 * @param {Node} callee
 * @param {Array.<Node>} args
 */
export default class Call extends Node {

  constructor(raw, callee, args) {
    super(nodeType.CALL, raw)
    this.callee = callee
    this.args = args
  }

}
