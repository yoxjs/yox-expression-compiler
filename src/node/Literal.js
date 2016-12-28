
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Literal 节点
 *
 * @param {string} value
 */
export default class Literal extends Node {

  constructor(value) {
    super(nodeType.LITERAL)
    this.value = value
  }

}
