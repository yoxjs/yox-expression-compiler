
import Node from './Node'
import * as nodeType from '../nodeType'

import isDef from 'yox-common/function/isDef'

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
      object[ env.RAW_TYPE ] === nodeType.MEMBER ? object.props : object
    )

    array.push(props, prop)

    let firstRaw = props[ 0 ].raw
    if (firstRaw === env.KEYPATH_PUBLIC_CURRENT
      || firstRaw === env.KEYPATH_PUBLIC_PARENT
    ) {
      this.lookup = env.FALSE
    }

    this.props = props

    let { staticKeypath } = object

    if (isDef(staticKeypath)
      && prop[ env.RAW_TYPE ] === nodeType.LITERAL
    ) {
      this.staticKeypath = staticKeypath
        ? staticKeypath + env.KEYPATH_SEPARATOR + prop[ env.RAW_VALUE ]
        : prop[ env.RAW_VALUE ]
    }

  }

}
