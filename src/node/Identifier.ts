import Node from './Node'
import * as nodeType from '../nodeType'

import * as env from 'yox-common/util/env'
import * as object from 'yox-common/util/object'

let keypathNames = { }
keypathNames[ env.KEYPATH_PUBLIC_CURRENT ] = env.KEYPATH_PRIVATE_CURRENT
keypathNames[ env.KEYPATH_PUBLIC_PARENT ] = env.KEYPATH_PRIVATE_PARENT

/**
 * Identifier 节点
 */
export default class Identifier extends Node {

  /**
   * 标识符名称
   */
  name: string

  /**
   * 是否向上寻找
   *
   * 默认开启
   */
  lookup = true

  /**
   * 静态路径
   */
  staticKeypath: string

  constructor(raw: string, name: string) {
    super(nodeType.IDENTIFIER, raw)
    // public -> private
    if (object.has(keypathNames, name)) {
      name = keypathNames[ name ]
      this.lookup = env.FALSE
    }
    this.name =
    this.staticKeypath = name
  }

}
