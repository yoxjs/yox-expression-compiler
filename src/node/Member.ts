import Variable from './Variable'
import Identifier from './Identifier';

import * as nodeType from '../nodeType'

/**
 * Member 节点
 */
export default class Member extends Variable {

  constructor(raw: string, lookup: boolean, staticKeypath: string | void, public props: Identifier[]) {
    super(nodeType.MEMBER, raw, lookup, staticKeypath)
  }

}
