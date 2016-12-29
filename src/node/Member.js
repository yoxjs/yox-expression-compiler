
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Member 节点
 *
 * @param {Identifier} object
 * @param {Node} prop
 */
export default class Member extends Node {

  constructor(object, prop) {
    super(nodeType.MEMBER)
    this.object = object
    this.prop = prop
  }

}

Member.flatten = function (node) {

  let result = [ ]

  let next
  do {
    next = node.object
    if (node.type === nodeType.MEMBER) {
      result.unshift(node.prop)
    }
    else {
      result.unshift(node)
    }
  }
  while (node = next)

  return result

}
