import * as compiler from './src/compiler'
import * as executor from './src/executor'

import Node from './src/node/Node'

export function compile(content: string) {
  return compiler.compile(content)
}

export function execute(node: Node, getter?: (keypath: string, node: Node) => any, context?: any) {
  return executor.execute(node, getter, context)
}