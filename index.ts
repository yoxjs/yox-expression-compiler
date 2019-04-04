import Parser from './src/Parser'
import * as executor from './src/executor'

import Node from './src/node/Node'

export function compile(code: string) {
  const parser = new Parser(code)
  return parser.scanTernary(parser.index)
}

export function execute(node: Node, getter?: (keypath: string, node: Node) => any, context?: any) {
  return executor.execute(node, getter, context)
}