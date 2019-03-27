
import Node from './Node'
import * as nodeType from '../nodeType'

/**
 * Literal 节点
 */
export default class Literal extends Node {

  value: any

  constructor(raw: string, value: any) {
    super(nodeType.LITERAL, raw)
    this.value = value
  }

}
