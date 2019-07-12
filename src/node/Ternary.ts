import Node from './Node'

export default interface Ternary extends Node {

  test: Node

  yes: Node

  no: Node

}
