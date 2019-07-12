import Node from './Node'

export default interface Binary extends Node {

  left: Node

  operator: string

  right: Node

}
