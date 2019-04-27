import Node from './Node'

/**
 * Binary 节点
 */
export default interface Binary extends Node {

  left: Node

  op: string

  right: Node

}
