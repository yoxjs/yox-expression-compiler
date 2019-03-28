import Variable from './Variable'
import * as nodeType from '../nodeType'

/**
 * Identifier 节点
 */
export default class Identifier extends Variable {

  constructor(raw: string, lookup: boolean, public name: string) {
    super(nodeType.IDENTIFIER, raw, lookup, name)
  }

}
