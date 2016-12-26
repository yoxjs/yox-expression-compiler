
import Node from './Node'
import Literal from './Literal'
import * as nodeType from '../nodeType'

import * as is from 'yox-common/util/is'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'
import * as keypathUtil from 'yox-common/util/keypath'

/**
 * Member 节点
 *
 * @param {Identifier} object
 * @param {Node} property
 */
export default class Member extends Node {

  constructor(options) {
    super(nodeType.MEMBER)
    object.extend(this, options)
  }

  flatten() {
    let result = [ ]

    let current = this, next
    do {
      next = current.object
      if (current.type === nodeType.MEMBER) {
        result.unshift(current.property)
      }
      else {
        result.unshift(current)
      }
    }
    while (current = next)

    return result
  }

  stringify(list) {
    return this.flatten()
    .map(
      function (node, index) {
        if (node.type === nodeType.LITERAL) {
          let { value } = node
          return is.numeric(value)
            ? `[${value}]`
            : `.${value}`
        }
        else {
          node = node.stringify()
          return index > 0
            ? `[${node}]`
            : node
        }
      }
    )
    .join('')
  }

  execute(context) {

    let deps = { }, keys = [ ]

    array.each(
      this.flatten(),
      function (node, index) {
        if (node.type !== nodeType.LITERAL) {
          if (index > 0) {
            let result = node.execute(context)
            object.extend(deps, result.deps)
            keys.push(result.value)
          }
          else if (node.type === nodeType.IDENTIFIER) {
            keys.push(node.name)
          }
        }
        else {
          keys.push(node.value)
        }
      }
    )

    let key = keypathUtil.stringify(keys)
    let { value, keypath } = context.get(key)

    deps[ keypath ] = value

    return {
      value,
      deps,
    }
  }

}
