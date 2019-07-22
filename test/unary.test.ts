import { compile } from 'yox-expression-compiler/src/compiler'

import * as nodeType from 'yox-expression-compiler/src/nodeType'

// import Node from 'yox-expression-compiler/src/node/Node'
import Unary from 'yox-expression-compiler/src/node/Unary'
import Literal from 'yox-expression-compiler/src/node/Literal'
import Identifier from 'yox-expression-compiler/src/node/Identifier'


test('unary', () => {

  let ast = compile(' + true ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.UNARY)
    expect((ast as Unary).operator).toBe('+')
    expect((ast as Unary).node.type).toBe(nodeType.LITERAL)
    expect(((ast as Unary).node as Literal).value).toBe(true)
    expect(ast.raw).toBe('+ true')
  }


  ast = compile(' + c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.UNARY)
    expect((ast as Unary).operator).toBe('+')
    expect((ast as Unary).node.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Unary).node as Identifier).name).toBe('c')
    expect(ast.raw).toBe('+ c')
  }


  ast = compile(' -c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.UNARY)
    expect((ast as Unary).operator).toBe('-')
    expect((ast as Unary).node.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Unary).node as Identifier).name).toBe('c')
    expect(ast.raw).toBe('-c')
  }


  ast = compile(' ~c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.UNARY)
    expect((ast as Unary).operator).toBe('~')
    expect((ast as Unary).node.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Unary).node as Identifier).name).toBe('c')
    expect(ast.raw).toBe('~c')
  }


  ast = compile(' ~ "0.1" ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.UNARY)
    expect((ast as Unary).operator).toBe('~')
    expect((ast as Unary).node.type).toBe(nodeType.LITERAL)
    expect(((ast as Unary).node as Literal).value).toBe('0.1')
    expect(ast.raw).toBe('~ "0.1"')
  }


  ast = compile(' !a ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.UNARY)
    expect((ast as Unary).operator).toBe('!')
    expect((ast as Unary).node.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Unary).node as Identifier).name).toBe('a')
    expect(ast.raw).toBe('!a')
  }


  ast = compile(' ! true ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.UNARY)
    expect((ast as Unary).operator).toBe('!')
    expect((ast as Unary).node.type).toBe(nodeType.LITERAL)
    expect(((ast as Unary).node as Literal).value).toBe(true)
    expect(ast.raw).toBe('! true')
  }



  ast = compile(' !!a ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.UNARY)
    expect((ast as Unary).operator).toBe('!!')
    expect((ast as Unary).node.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Unary).node as Identifier).name).toBe('a')
    expect(ast.raw).toBe('!!a')
  }


})
