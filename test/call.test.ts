import { compile } from 'yox-expression-compiler/src/compiler'

import * as nodeType from 'yox-expression-compiler/src/nodeType'

import Call from 'yox-expression-compiler/src/node/Call'
import Literal from 'yox-expression-compiler/src/node/Literal'
import Identifier from 'yox-expression-compiler/src/node/Identifier'

test('call', () => {

  let ast = compile(' a() ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.CALL)
    expect((ast as Call).name.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Call).name as Identifier).name).toBe('a')
    expect(((ast as Call).name as Identifier).lookup).toBe(true)
    expect(((ast as Call).name as Identifier).offset).toBe(0)

    expect((ast as Call).args.length).toBe(0)

    expect(ast.raw).toBe('a()')
  }


  ast = compile(' a.b.c() ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.CALL)
    expect((ast as Call).name.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Call).name as Identifier).name).toBe('a.b.c')
    expect(((ast as Call).name as Identifier).lookup).toBe(true)
    expect(((ast as Call).name as Identifier).offset).toBe(0)

    expect((ast as Call).args.length).toBe(0)

    expect(ast.raw).toBe('a.b.c()')
  }



  ast = compile(' this.a.b.c(d, this.e, 1) ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.CALL)
    expect((ast as Call).name.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Call).name as Identifier).name).toBe('a.b.c')
    expect(((ast as Call).name as Identifier).lookup).toBe(false)
    expect(((ast as Call).name as Identifier).offset).toBe(0)

    expect((ast as Call).args.length).toBe(3)
    expect((ast as Call).args[0].type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Call).args[0] as Identifier).name).toBe('d')
    expect(((ast as Call).args[0] as Identifier).lookup).toBe(true)
    expect(((ast as Call).args[0] as Identifier).offset).toBe(0)
    expect(((ast as Call).args[0] as Identifier).raw).toBe('d')


    expect((ast as Call).args[1].type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Call).args[1] as Identifier).name).toBe('e')
    expect(((ast as Call).args[1] as Identifier).lookup).toBe(false)
    expect(((ast as Call).args[1] as Identifier).offset).toBe(0)
    expect(((ast as Call).args[1] as Identifier).raw).toBe('this.e')


    expect((ast as Call).args[2].type).toBe(nodeType.LITERAL)
    expect(((ast as Call).args[2] as Literal).value).toBe(1)
    expect(((ast as Call).args[2] as Literal).raw).toBe('1')

    expect(ast.raw).toBe('this.a.b.c(d, this.e, 1)')
  }



  ast = compile(' ../../a.b.c(d, this.e, 1) ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.CALL)
    expect((ast as Call).name.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Call).name as Identifier).name).toBe('a.b.c')
    expect(((ast as Call).name as Identifier).lookup).toBe(false)
    expect(((ast as Call).name as Identifier).offset).toBe(2)

    expect((ast as Call).args.length).toBe(3)
    expect((ast as Call).args[0].type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Call).args[0] as Identifier).name).toBe('d')
    expect(((ast as Call).args[0] as Identifier).lookup).toBe(true)
    expect(((ast as Call).args[0] as Identifier).offset).toBe(0)
    expect(((ast as Call).args[0] as Identifier).raw).toBe('d')


    expect((ast as Call).args[1].type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Call).args[1] as Identifier).name).toBe('e')
    expect(((ast as Call).args[1] as Identifier).lookup).toBe(false)
    expect(((ast as Call).args[1] as Identifier).offset).toBe(0)
    expect(((ast as Call).args[1] as Identifier).raw).toBe('this.e')


    expect((ast as Call).args[2].type).toBe(nodeType.LITERAL)
    expect(((ast as Call).args[2] as Literal).value).toBe(1)
    expect(((ast as Call).args[2] as Literal).raw).toBe('1')

    expect(ast.raw).toBe('../../a.b.c(d, this.e, 1)')
  }


})