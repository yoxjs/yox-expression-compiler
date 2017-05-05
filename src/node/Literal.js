
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Literal 节点
 *
 * @param {string} raw
 * @param {*} value
 */
export default class Literal extends Node {

  constructor(raw, value) {
    super(nodeType.LITERAL, raw)
    this.value = value
  }

}
