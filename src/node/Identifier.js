
import Node from './Node'
import * as nodeType from '../nodeType'

import * as object from 'yox-common/util/object'

/**
 * Identifier 节点
 *
 * @param {string} name
 */
export default class Identifier extends Node {

  constructor(options) {
    super(nodeType.IDENTIFIER)
    object.extend(this, options)
  }

  stringify() {
    return this.name
  }

  execute(context) {
    let deps = { }
    let { value, keypath } = context.get(this.name)
    deps[ keypath ] = value
    return { value, deps }
  }

}
