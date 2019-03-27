
import * as string from 'yox-common/util/string'

/**
 * 节点基类
 */
export default class Node {

  /**
   * 节点类型
   */
  type: number

  /**
   * 解析出来的原始字符串
   */
  raw: string

  constructor(type: number, raw: string) {
    this.type = type
    this.raw = string.trim(raw)
  }

}
