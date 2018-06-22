
import Node from './Node'
import * as nodeType from '../nodeType'

import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as object from 'yox-common/util/object'

let names = { }
names[ env.KEYPATH_PUBLIC_CURRENT ] = env.KEYPATH_PRIVATE_CURRENT
names[ env.KEYPATH_PUBLIC_PARENT ] = env.KEYPATH_PRIVATE_PARENT

/**
 * Identifier 节点
 *
 * @param {string} raw
 * @param {string} name
 */
export default class Identifier extends Node {

  constructor(raw, name) {
    super(nodeType.IDENTIFIER, raw)
    if (object.has(names, name)) {
      name = names[ name ]
      this.lookup = env.FALSE
    }
    this[ env.RAW_NAME ] =
    this[ env.RAW_STATIC_KEYPATH ] = name
  }

}
