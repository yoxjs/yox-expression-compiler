import { compile } from '../src/compiler'

import * as nodeType from '../src/nodeType'

import Binary from '../src/node/Binary'
import Identifier from '../src/node/Identifier'

test('binary', () => {

  let ast = compile(' b * c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('*')
    expect((ast as Binary).left.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Binary).right.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Binary).left as Identifier).name).toBe('b')
    expect(((ast as Binary).right as Identifier).name).toBe('c')
    expect(ast.raw).toBe('b * c')
  }

  ast = compile(' b / c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('/')
  }

  ast = compile(' b % c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('%')
  }

  ast = compile(' b + c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('+')
  }

  ast = compile(' b - c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('-')
  }

  ast = compile(' b << c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('<<')
  }

  ast = compile(' b >> c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('>>')
  }

  ast = compile(' b >>> c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('>>>')
  }

  ast = compile(' b < c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('<')
  }

  ast = compile(' b <= c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('<=')
  }

  ast = compile(' b > c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('>')
  }

  ast = compile(' b >= c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('>=')
  }

  ast = compile(' b == c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('==')
  }

  ast = compile(' b != c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('!=')
  }

  ast = compile(' b === c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('===')
  }

  ast = compile(' b !== c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('!==')
  }

  ast = compile(' b & c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('&')
  }

  ast = compile(' b ^ c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('^')
  }

  ast = compile(' b | c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('|')
  }

  ast = compile(' b && c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('&&')
  }

  ast = compile(' b || c ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('||')
  }

  ast = compile(' b + c * b ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.BINARY)
    expect((ast as Binary).operator).toBe('+')
    expect((ast as Binary).left.type).toBe(nodeType.IDENTIFIER)
    expect((ast as Binary).right.type).toBe(nodeType.BINARY)
    expect(((ast as Binary).left as Identifier).name).toBe('b')
    expect(((ast as Binary).right as Binary).operator).toBe('*')
    expect(((ast as Binary).right as Binary).raw).toBe('c * b')
    expect(ast.raw).toBe('b + c * b')
  }

})