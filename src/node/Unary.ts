import Node from './Node'

export default interface Unary extends Node {

  operator: string

  node: Node

}
