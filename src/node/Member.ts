import Node from './Node'
import Keypath from './Keypath'

export default interface Member extends Keypath {

  lead: Node

  // format()[a][b] 这样的后面带有动态节点
  nodes: Node[] | void

  // format().a.b 这样的后面全是静态节点
  keypath: string | void

}
