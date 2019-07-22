import { compile } from 'yox-expression-compiler/src/compiler'

import * as nodeType from 'yox-expression-compiler/src/nodeType'

import Node from 'yox-expression-compiler/src/node/Node'
import Array from 'yox-expression-compiler/src/node/Array'
import Literal from 'yox-expression-compiler/src/node/Literal'

function testLiteral(node: Node | void, value: any, raw: string) {
  expect(node != null).toBe(true)
  if (node) {
    expect(node.type).toBe(nodeType.LITERAL)
    expect((node as Literal).value).toBe(value)
    expect(node.raw).toBe(raw)
  }
}

test('array', () => {

  let ast = compile(' [1 , "2" , true] ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.ARRAY)
    expect(Array.isArray((ast as Array).nodes)).toBe(true)
    expect((ast as Array).nodes.length).toBe(3)

    testLiteral((ast as Array).nodes[0], 1, '1')
    testLiteral((ast as Array).nodes[1], '2', '"2"')
    testLiteral((ast as Array).nodes[2], true, 'true')
  }

  // 支持尾逗号
  ast = compile(' [1 , "2" , true, ]  ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.ARRAY)
    expect(Array.isArray((ast as Array).nodes)).toBe(true)
    expect((ast as Array).nodes.length).toBe(3)
  }

})