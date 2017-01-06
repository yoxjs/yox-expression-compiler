
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Literal 节点
 *
 * @param {string} raw
 */
export default class Literal extends Node {

  constructor(raw, value = raw) {
    super(nodeType.LITERAL)
    this.raw = raw
    this.value = value
  }

}
