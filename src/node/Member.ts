import Node from './Node'
import Keypath from './Keypath'

/**
 * Member 节点
 */
export default interface Member extends Keypath {

  props: Node[]

}
