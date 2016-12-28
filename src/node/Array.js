
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Array 节点
 *
 * @param {Array.<Node>} elements
 */
export default class Array extends Node {

  constructor(elements) {
    super(nodeType.ARRAY)
    this.elements = elements
  }

}
