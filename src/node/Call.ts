import Node from './Node'

/**
 * Call 节点
 */
export default interface Call extends Node {

  callee: Node

  args: Node[]

}
