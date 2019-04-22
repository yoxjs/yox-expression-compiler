import Node from './Node'

/**
 * Keypath 节点
 */
export default interface Keypath extends Node {

  lookup: boolean

  staticKeypath?: string

  absoluteKeypath?: string

  offset: number

}
