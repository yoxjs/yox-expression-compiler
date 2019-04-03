import Node from './Node'

/**
 * Unary 节点
 */
export default interface Unary extends Node {

  operator: string

  arg: Node

}
