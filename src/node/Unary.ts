
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Unary 节点
 */
export default class Unary extends Node {

  operator: string

  arg: Node

  constructor(raw: string, operator: string, arg: Node) {
    super(nodeType.UNARY, raw)
    this.operator = operator
    this.arg = arg
  }

}
