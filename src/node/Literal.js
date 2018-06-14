
import Node from './Node'
import * as nodeType from '../nodeType'

import * as env from 'yox-common/util/env'

/**
 * Literal 节点
 *
 * @param {string} raw
 * @param {*} value
 */
export default class Literal extends Node {

  constructor(raw, value) {
    super(nodeType.LITERAL, raw)
    this[ env.RAW_VALUE ] = value
  }

}
