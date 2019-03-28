
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Array 节点
 */
export default class Array extends Node {

  constructor(raw: string, public elements: Node[]) {
    super(nodeType.ARRAY, raw)
  }

}
