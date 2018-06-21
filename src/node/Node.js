
import * as env from 'yox-common/util/env'
import * as string from 'yox-common/util/string'

/**
 * 节点基类
 */
export default class Node {

  constructor(type, raw) {
    this[ env.RAW_TYPE ] = type
    this.raw = string.trim(raw)
  }

}
