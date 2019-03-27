
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Binary 节点
 */
export default class Binary extends Node {

  left: Node

  operator: string

  right: Node

  constructor(raw: string, left: Node, operator: string, right: Node) {
    super(nodeType.BINARY, raw)
    this.left = left
    this.operator = operator
    this.right = right
  }

}
