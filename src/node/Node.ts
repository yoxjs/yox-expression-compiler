import * as string from 'yox-common/util/string'

/**
 * 节点基类
 */
export default class Node {

  /**
   * 解析出来的原始字符串
   */
  raw: string

  constructor(public type: number, raw: string) {
    this.raw = string.trim(raw)
  }

}
