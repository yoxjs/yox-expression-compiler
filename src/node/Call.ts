
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Call 节点
 */
export default class Call extends Node {

  callee: Node

  args: Node[]

  constructor(raw: string, callee: Node, args: Node[]) {
    super(nodeType.CALL, raw)
    this.callee = callee
    this.args = args
  }

}
