import { compile } from 'yox-expression-compiler/src/compiler'

import * as nodeType from 'yox-expression-compiler/src/nodeType'

import Ternary from 'yox-expression-compiler/src/node/Ternary'
import Literal from 'yox-expression-compiler/src/node/Literal'
import Identifier from 'yox-expression-compiler/src/node/Identifier'

test('ternary', () => {

  let ast = compile(' a ? 1 : 0 ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.TERNARY)

    expect((ast as Ternary).test.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Ternary).test as Identifier).name).toBe('a')
    expect((ast as Ternary).test.raw).toBe('a')

    expect((ast as Ternary).yes.type).toBe(nodeType.LITERAL)
    expect(((ast as Ternary).yes as Literal).value).toBe(1)
    expect((ast as Ternary).yes.raw).toBe('1')

    expect((ast as Ternary).no.type).toBe(nodeType.LITERAL)
    expect(((ast as Ternary).no as Literal).value).toBe(0)
    expect((ast as Ternary).no.raw).toBe('0')

    expect(ast.raw).toBe('a ? 1 : 0')
  }

})