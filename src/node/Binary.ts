
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Binary 节点
 */
export default class Binary extends Node {

  constructor(raw: string, public left: Node, public operator: string, public right: Node) {
    super(nodeType.BINARY, raw)
  }

}
