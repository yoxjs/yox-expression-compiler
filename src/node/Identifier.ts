import Node from './Node'

/**
 * Identifier 节点
 */
export default interface Identifier extends Node {

  name: string

  lookup: boolean

  staticKeypath: string | void

}
