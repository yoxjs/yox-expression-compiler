
import Node from './Node'
import * as nodeType from '../nodeType'

import * as array from 'yox-common/util/array'

/**
 * Member 节点
 *
 * @param {Node} object
 * @param {Node} prop
 */
export default class Member extends Node {

  constructor(source, object, prop) {
    super(nodeType.MEMBER, source)

    let props = [ ]
    if (object.type === nodeType.MEMBER) {
      array.push(props, object.props)
    }
    else {
      array.push(props, object)
    }

    array.push(props, prop)

    this.props = props

  }

}
