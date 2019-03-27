
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Ternary 节点
 */
export default class Ternary extends Node {

  test: Node

  yes: Node

  no: Node

  constructor(raw: string, test: Node, yes: Node, no: Node) {
    super(nodeType.TERNARY, raw)
    this.test = test
    this.yes = yes
    this.no = no
  }

}
