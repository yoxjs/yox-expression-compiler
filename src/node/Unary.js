
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
    switch (operator) {
      case Unary.PLUS:
        value = +value
        break
      case Unary.MINUS:
        value = -value
        break
      case Unary.BANG:
        value = !value
        break
      case Unary.WAVE:
        value = ~value
        break
    }
    return {
      value,
      deps,
    }
  }

}

Unary.PLUS = '+'
Unary.MINUS = '-'
Unary.BANG = '!'
Unary.WAVE = '~'
