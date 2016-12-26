
import Node from './Node'
import * as nodeType from '../nodeType'

import * as is from 'yox-common/util/is'
import * as object from 'yox-common/util/object'

/**
 * Literal 节点
 *
 * @param {string} value
 */
export default class Literal extends Node {

  constructor(options) {
    super(nodeType.LITERAL)
    object.extend(this, options)
  }

  stringify() {
    let { value } = this
    if (is.string(value)) {
      return value.indexOf('"') >= 0
        ? `'${value}'`
        : `"${value}"`
    }
    return value
  }

  execute() {
    return {
      value: this.value,
      deps: { },
    }
  }

}
