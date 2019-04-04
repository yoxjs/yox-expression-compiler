import Node from './Node'

/**
 * Member 节点
 */
export default interface Member extends Node {

  props: Node[]

  lookup: boolean

  staticKeypath: string | void

}
