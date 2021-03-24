import Node from './Node'

export default interface Keypath extends Node {

  // 是否直接从顶层查找
  root: boolean

  // 是否向上查找
  lookup: boolean

  // 查找的 context 偏移量
  offset: number

}
