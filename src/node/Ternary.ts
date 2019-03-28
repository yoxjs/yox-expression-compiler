import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Ternary 节点
 */
export default class Ternary extends Node {

  constructor(raw: string, public test: Node, public yes: Node, public no: Node) {
    super(nodeType.TERNARY, raw)
  }

}
