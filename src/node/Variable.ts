import Node from './Node'
import * as env from 'yox-common/util/env'

/**
 * Variable 节点
 */
export default abstract class Variable extends Node {

  constructor(type: number, raw: string, public lookup = false, public staticKeypath: string | void = env.UNDEFINED) {
    super(type, raw)
  }

}
