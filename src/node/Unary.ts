import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Unary 节点
 */
export default class Unary extends Node {

  constructor(raw: string, public operator: string, public arg: Node) {
    super(nodeType.UNARY, raw)
  }

}
