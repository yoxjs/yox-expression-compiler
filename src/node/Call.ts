
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Call 节点
 */
export default class Call extends Node {

  constructor(raw: string, public callee: Node, public args: Node[]) {
    super(nodeType.CALL, raw)
  }

}
