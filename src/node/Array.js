
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Array 节点
 *
 * @param {Array.<Node>} elements
 */
export default class Array extends Node {

  constructor(source, lements) {
    super(nodeType.ARRAY, source)
    this.elements = elements
  }

}
