
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Array 节点
 */
export default class Array extends Node {

  elements: Node[]

  constructor(raw: string, elements: Node[]) {
    super(nodeType.ARRAY, raw)
    this.elements = elements
  }

}
