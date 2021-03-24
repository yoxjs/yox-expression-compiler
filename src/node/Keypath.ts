import Node from './Node'

export default interface Keypath extends Node {

  // 是否直接从顶层查找
  root: boolean

  // 默认为 true，节省序列化的字符长度
  lookup: boolean

  // 默认为 0，节省序列化的字符长度
  offset: number

}
