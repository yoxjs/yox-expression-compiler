
import Node from './Node'
import * as nodeType from '../nodeType'

import * as object from 'yox-common/util/object'

/**
 * Unary 节点
 *
 * @param {string} operator
 * @param {Node} arg
 */
export default class Unary extends Node {

  constructor(options) {
    super(nodeType.UNARY)
    object.extend(this, options)
  }

  stringify() {
    let { operator, arg } = this
    return `${operator}${arg.stringify()}`
  }

  execute(context) {
    let { operator, arg } = this
    let { value, deps } = arg.execute(context)
    return {
      value: OPERATOR[operator](value),
      deps,
    }
  }

}

let OPERATOR = { }
OPERATOR[ Unary.PLUS = '+' ] = function (value) {
  return +value
}
OPERATOR[ Unary.MINUS = '-' ] = function (value) {
  return -value
}
OPERATOR[ Unary.BANG = '!' ] = function (value) {
  return !value
}
OPERATOR[ Unary.WAVE = '~' ] = function (value) {
  return ~value
}
