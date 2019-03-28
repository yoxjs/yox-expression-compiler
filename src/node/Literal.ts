
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Literal 节点
 */
export default class Literal extends Node {

  constructor(raw: string, public value: any) {
    super(nodeType.LITERAL, raw)
  }

}
