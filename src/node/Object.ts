
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Object 节点
 */
export default class Object extends Node {

  constructor(raw: string, public keys: string[], public values: Node[]) {
    super(nodeType.OBJECT, raw)
  }

}
