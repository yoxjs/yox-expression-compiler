
import Node from './Node'
import * as nodeType from '../nodeType'

import * as config from 'yox-config'
import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as object from 'yox-common/util/object'

let names = { }
names[ env.RAW_THIS ] = char.CHAR_BLANK
names[ env.KEYPATH_PARENT ] = config.SPECIAL_PARENT

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
    this.name =
    this.staticKeypath = name
  }

}
