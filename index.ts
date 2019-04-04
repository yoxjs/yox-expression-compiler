import Scanner from './src/parser/Scanner'
import Executor from './src/parser/Executor'

import Node from './src/node/Node'

export function compile(code: string) {
  const scanner = new Scanner(code)
  return scanner.scanTernary(scanner.index)
}

export function execute(node: Node, getter?: (keypath: string, node: Node) => any, context?: any) {
  return Executor(node, getter, context)
}