
import * as string from 'yox-common/util/string'

/**
 * 节点基类
 */
export default class Node {

  constructor(type, raw) {
    this.type = type
    this.raw = string.trim(raw)
  }

}
