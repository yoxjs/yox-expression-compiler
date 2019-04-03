import Variable from './Variable'

import * as nodeType from '../nodeType'

/**
 * Member 节点
 */
export default class Member extends Variable {

  constructor(raw: string, lookup: boolean, staticKeypath: string | void, public props: Node[]) {
    super(nodeType.MEMBER, raw, lookup, staticKeypath)
  }

}
