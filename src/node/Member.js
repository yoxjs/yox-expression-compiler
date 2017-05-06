
import Node from './Node'
import * as nodeType from '../nodeType'

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

    if (object.keypath
      && prop.type === nodeType.LITERAL
    ) {
      this.keypath = keypathUtil.join(object.keypath, prop.value)
    }

  }

}
