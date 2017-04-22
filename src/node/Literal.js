
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Literal 节点
 *
 * @param {*} value
 */
export default class Literal extends Node {

  constructor(source, value) {
    super(nodeType.LITERAL, source)
    this.value = value
  }

}
