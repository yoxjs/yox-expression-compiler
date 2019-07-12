import Node from './Node'

export default interface Object extends Node {

  keys: string[]

  values: Node[]

}
