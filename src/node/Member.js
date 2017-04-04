
import Node from './Node'
import * as nodeType from '../nodeType'

import * as array from 'yox-common/util/array'

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

/**
 * 把树形的 Member 节点转换成一维数组的形式
 *
 * @param {Member} node
 * @return {Array.<Node>}
 */
Member.flatten = function (node) {

  let result = [ ]

  let next
  do {
    next = node.object
    if (node.type === nodeType.MEMBER) {
      array.unshift(result, node.prop)
    }
    else {
      array.unshift(result, node)
    }
  }
  while (node = next)

  return result

}
