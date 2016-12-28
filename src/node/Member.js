
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Member 节点
 *
 * @param {Identifier} object
 * @param {Node} property
 */
export default class Member extends Node {

  constructor(object, property) {
    super(nodeType.MEMBER)
    this.object = object
    this.property = property
  }

}

Member.flatten = function (node) {

  let result = [ ]

  let next
  do {
    next = node.object
    if (node.type === nodeType.MEMBER) {
      result.unshift(node.property)
    }
    else {
      result.unshift(node)
    }
  }
  while (node = next)

  return result

}
