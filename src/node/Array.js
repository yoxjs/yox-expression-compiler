
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Array 节点
 *
 * @param {string} raw 源码
 * @param {Array.<Node>} elements 数组元素
 */
export default class Array extends Node {

  constructor(raw, elements) {
    super(nodeType.ARRAY, raw)
    this.elements = elements
  }

}
