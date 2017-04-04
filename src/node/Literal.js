
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Literal 节点
 *
 * @param {*} value
 * @param {string} raw
 */
export default class Literal extends Node {

  constructor(value, raw) {
    super(nodeType.LITERAL)
    this.value = value
    if (raw) {
      this.raw = raw
    }
  }

}
