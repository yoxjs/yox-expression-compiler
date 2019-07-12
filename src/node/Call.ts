import Node from './Node'

export default interface Call extends Node {

  name: Node

  args: Node[]

}
