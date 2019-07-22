import { compile } from 'yox-expression-compiler/src/compiler'

import * as nodeType from 'yox-expression-compiler/src/nodeType'

import Node from 'yox-expression-compiler/src/node/Node'
import Object from 'yox-expression-compiler/src/node/Object'
import Literal from 'yox-expression-compiler/src/node/Literal'

function testLiteral(node: Node | void, value: any, raw: string) {
  expect(node != null).toBe(true)
  if (node) {
    expect(node.type).toBe(nodeType.LITERAL)
    expect((node as Literal).value).toBe(value)
    expect(node.raw).toBe(raw)
  }
}

test('object', () => {

  // 支持尾逗号
  let ast = compile(' { name : "musicode", "age" : 100, }')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.OBJECT)
    expect((ast as Object).keys.length).toBe(2)
    expect((ast as Object).values.length).toBe(2)

    expect((ast as Object).keys[0]).toBe('name')
    testLiteral((ast as Object).values[0], 'musicode', '"musicode"')

    expect((ast as Object).keys[1]).toBe('age')
    testLiteral((ast as Object).values[1], 100, '100')

    expect(ast.raw).toBe('{ name : "musicode", "age" : 100, }')
  }

})