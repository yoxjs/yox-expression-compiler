
import Node from './Node'
import * as nodeType from '../nodeType'

import * as object from 'yox-common/util/object'

/**
 * Binary 节点
 *
 * @param {Node} left
 * @param {string} operator
 * @param {Node} right
 */
export default class Binary extends Node {

  constructor(options) {
    super(nodeType.BINARY)
    object.extend(this, options)
  }

  stringify() {
    let { left, operator, right } = this
    return `${left.stringify()} ${operator} ${right.stringify()}`
  }

  execute(context) {
    let { left, operator, right } = this
    left = left.execute(context)
    right = right.execute(context)
    return {
      value: OPERATOR[operator](left.value, right.value),
      deps: object.extend(left.deps, right.deps),
    }
  }

}

let OPERATOR = { }
OPERATOR[ Binary.OR = '||' ] = function (a, b) {
  return a || b
}
OPERATOR[Binary.AND = '&&' ] = function (a, b) {
  return a && b
}
OPERATOR[ Binary.SE = '===' ] = function (a, b) {
  return a === b
}
OPERATOR[ Binary.SNE = '!==' ] = function (a, b) {
  return a !== b
}
OPERATOR[ Binary.LE = '==' ] = function (a, b) {
  return a == b
}
OPERATOR[ Binary.LNE = '!=' ] = function (a, b) {
  return a != b
}
OPERATOR[ Binary.LT = '<' ] = function (a, b) {
  return a < b
}
OPERATOR[ Binary.LTE = '<=' ] = function (a, b) {
  return a <= b
}
OPERATOR[ Binary.GT = '>' ] = function (a, b) {
  return a > b
}
OPERATOR[ Binary.GTE = '>=' ] = function (a, b) {
  return a >= b
}
OPERATOR[ Binary.PLUS = '+' ] = function (a, b) {
  return a + b
}
OPERATOR[ Binary.MINUS = '-' ] = function (a, b) {
  return a - b
}
OPERATOR[ Binary.MULTIPLY = '*' ] = function (a, b) {
  return a * b
}
OPERATOR[ Binary.DIVIDE = '/' ] = function (a, b) {
  return a / b
}
OPERATOR[ Binary.MODULO = '%' ] = function (a, b) {
  return a % b
}
