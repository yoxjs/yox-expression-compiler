
import Node from './Node'
import * as nodeType from '../nodeType'

import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'

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

    array.push(
      props,
      object.type === nodeType.MEMBER ? object.props : object
    )

    array.push(props, prop)

    this.props = props

    if (object.staticKeypath
      && prop.type === nodeType.LITERAL
    ) {
      this.staticKeypath = object.staticKeypath + env.KEYPATH_SEPARATOR + prop.value
    }

  }

}
