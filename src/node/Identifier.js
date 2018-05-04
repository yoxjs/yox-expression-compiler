
import Node from './Node'
import * as nodeType from '../nodeType'

import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'

/**
 * Identifier 节点
 *
 * @param {string} raw
 * @param {string} name
 */
export default class Identifier extends Node {

  constructor(raw, name) {
    super(nodeType.IDENTIFIER, raw)
    if (name === env.RAW_THIS) {
      name = char.CHAR_BLANK
      this.lookup = env.FALSE
    }
    else if (name === env.KEYPATH_PARENT) {
      this.lookup = env.FALSE
    }
    this.name =
    this.staticKeypath = name
  }

}
