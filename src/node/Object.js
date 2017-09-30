
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Object 节点
 *
 * @param {string} raw 源码
 * @param {Array.<string>} keys
 * @param {Array.<Node>} values
 */
export default class Object extends Node {

  constructor(raw, keys, values) {
    super(nodeType.OBJECT, raw)
    this.keys = keys
    this.values = values
  }

}
