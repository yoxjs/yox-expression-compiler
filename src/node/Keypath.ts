import Node from './Node'

/**
 * Keypath 节点
 */
export default interface Keypath extends Node {

  // 默认为 true，节省序列化的字符长度
  lookup: boolean | void

  // 默认为 0，节省序列化的字符长度
  offset: number | void

  staticKeypath?: string

  absoluteKeypath?: string

}
