
import Node from './Node'
import * as nodeType from '../nodeType'

import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'
import * as keypathUtil from 'yox-common/util/keypath'

/**
 * Member 节点
 *
 * @param {string} raw
 * @param {Node} object
 * @param {Node} prop
 */
export default class Member extends Node {

  constructor(raw, object, prop) {
    super(nodeType.MEMBER, raw)

    let props = [ ]
    if (object.type === nodeType.MEMBER) {
      array.push(props, object.props)
    }
    else {
      array.push(props, object)
    }

    array.push(props, prop)

    this.props = props

    let success = env.TRUE
    let keypath = Member.stringify(
      this,
      function () {
        success = env.FALSE
      }
    )
    if (success) {
      this.keypath = keypath
    }

  }

}

Member.stringify = function (node, execute) {
  let keypaths = node.props.map(
    function (node, index) {
      let { type } = node
      if (type !== nodeType.LITERAL) {
        if (index > 0) {
          return execute(node)
        }
        else if (type === nodeType.IDENTIFIER) {
          return node.name
        }
      }
      else {
        return node.value
      }
    }
  )
  return keypathUtil.stringify(keypaths)
}
