import { compile } from 'yox-expression-compiler/src/compiler'

import * as nodeType from 'yox-expression-compiler/src/nodeType'

import Identifier from 'yox-expression-compiler/src/node/Identifier'

test('identifier', () => {

  let ast = compile('    name    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('name')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(true)
    expect((ast as Identifier).offset).toBe(0)
    expect((ast as Identifier).literals).toBe(undefined)
    expect(ast.raw).toBe('name')
  }


  ast = compile('    this.name    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('name')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(false)
    expect((ast as Identifier).offset).toBe(0)
    expect((ast as Identifier).literals).toBe(undefined)
    expect(ast.raw).toBe('this.name')
  }

  ast = compile('    ../name    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('name')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(false)
    expect((ast as Identifier).offset).toBe(1)
    expect((ast as Identifier).literals).toBe(undefined)
    expect(ast.raw).toBe('../name')
  }

  ast = compile('    ../../name    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('name')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(false)
    expect((ast as Identifier).offset).toBe(2)
    expect((ast as Identifier).literals).toBe(undefined)
    expect(ast.raw).toBe('../../name')
  }

  ast = compile('    ~/name    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('name')
    expect((ast as Identifier).root).toBe(true)
    expect((ast as Identifier).lookup).toBe(false)
    expect((ast as Identifier).offset).toBe(0)
    expect((ast as Identifier).literals).toBe(undefined)
    expect(ast.raw).toBe('~/name')
  }

  ast = compile('    a.b.c    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('a.b.c')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(true)
    expect((ast as Identifier).offset).toBe(0)
    expect(ast.raw).toBe('a.b.c')

    const literals = (ast as Identifier).literals
    expect(Array.isArray(literals)).toBe(true)
    if (literals) {
      expect(literals[0]).toBe('a')
      expect(literals[1]).toBe('b')
      expect(literals[2]).toBe('c')
      expect(literals.length).toBe(3)
    }
  }

  ast = compile('    this.a.b.c    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('a.b.c')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(false)
    expect((ast as Identifier).offset).toBe(0)
    expect(ast.raw).toBe('this.a.b.c')

    const literals = (ast as Identifier).literals
    expect(Array.isArray(literals)).toBe(true)
    if (literals) {
      expect(literals[0]).toBe('a')
      expect(literals[1]).toBe('b')
      expect(literals[2]).toBe('c')
      expect(literals.length).toBe(3)
    }
  }

  ast = compile('    ../a.b.c    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('a.b.c')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(false)
    expect((ast as Identifier).offset).toBe(1)
    expect(ast.raw).toBe('../a.b.c')
  }

  ast = compile('    ~/a.b.c    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('a.b.c')
    expect((ast as Identifier).root).toBe(true)
    expect((ast as Identifier).lookup).toBe(false)
    expect((ast as Identifier).offset).toBe(0)
    expect(ast.raw).toBe('~/a.b.c')
  }


  ast = compile('    a[1].b    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('a.1.b')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(true)
    expect((ast as Identifier).offset).toBe(0)
    expect(ast.raw).toBe('a[1].b')
  }

  ast = compile('    a[1][2][3]    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('a.1.2.3')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(true)
    expect((ast as Identifier).offset).toBe(0)
    expect(ast.raw).toBe('a[1][2][3]')
  }

  ast = compile('    a["1"][2]["3"]    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('a.1.2.3')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(true)
    expect((ast as Identifier).offset).toBe(0)
    expect(ast.raw).toBe('a["1"][2]["3"]')
  }


  ast = compile('    ../../../this.a    ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Identifier).name).toBe('a')
    expect((ast as Identifier).root).toBe(false)
    expect((ast as Identifier).lookup).toBe(false)
    expect((ast as Identifier).offset).toBe(3)
    expect(ast.raw).toBe('../../../this.a')
  }

})