
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Object 节点
 */
export default class Object extends Node {

  keys: string[]

  values: Node[]

  constructor(raw: string, keys: string[], values: Node[]) {
    super(nodeType.OBJECT, raw)
    this.keys = keys
    this.values = values
  }

}
