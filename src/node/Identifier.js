
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Identifier 节点
 *
 * @param {string} raw
 * @param {string} name
 */
export default class Identifier extends Node {

  constructor(raw, name) {
    super(nodeType.IDENTIFIER, raw)
    this.name = name
    this.staticKeypath = name
  }

}
