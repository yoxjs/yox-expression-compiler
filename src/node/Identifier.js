
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
    this.name = name
    if (name === env.RAW_THIS) {
      this.lookup = env.FALSE
      this.staticKeypath = char.CHAR_BLANK
    }
    else {
      this.staticKeypath = name
    }
  }

}
