import Node from './Node'

import * as nodeType from '../nodeType'

/**
 * Member 节点
 */
export default interface Member extends Node {

  props: Node[]

  lookup: boolean

  staticKeypath: string | void

}
