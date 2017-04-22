
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Identifier 节点
 *
 * @param {string} name
 */
export default class Identifier extends Node {

  constructor(source, name) {
    super(nodeType.IDENTIFIER, source)
    this.name = name
  }

}
