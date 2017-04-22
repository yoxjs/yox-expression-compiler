
import * as string from 'yox-common/util/string'

/**
 * 节点基类
 */
export default class Node {

  constructor(type, source) {
    this.type = type
    this.source = string.trim(source)
  }

}
