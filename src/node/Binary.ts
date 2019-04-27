import Node from './Node'

/**
 * Binary 节点
 */
export default interface Binary extends Node {

  a: Node

  op: string

  b: Node

}
