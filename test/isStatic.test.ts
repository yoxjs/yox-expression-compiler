import { compile } from 'yox-expression-compiler/src/compiler'

test('literal', () => {

  let ast = compile(`  1  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

  ast = compile(`  "1"  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

})

test('unary', () => {

  let ast = compile(`  ~1.1 `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

  ast = compile(`  ~a  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).not.toBe(true)
  }

})

test('binary', () => {

  let ast = compile(`  1 + 1 `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

  ast = compile(`  a + 1  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).not.toBe(true)
  }

})

test('ternary', () => {

  let ast = compile(`  1 ? 2 : 3 `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

  ast = compile(`  a ? 1 : 2  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).not.toBe(true)
  }

})

test('call', () => {

  let ast = compile(`  invoke() `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).not.toBe(true)
  }

})

test('array', () => {

  let ast = compile(`  [1,2,3,4]  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

  ast = compile(`  [a,2,3,4]  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).not.toBe(true)
  }

})

test('object', () => {

  let ast = compile(`  {a: 1, b: "1"}  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

  ast = compile(`  {a: a, b: "1"}  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).not.toBe(true)
  }

})

test('object', () => {

  let ast = compile(`  {a: 1, b: "1"}  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

  ast = compile(`  {a: a, b: "1"}  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(false)
  }

})

test('member', () => {

  let ast = compile(`  "123".length  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).toBe(true)
  }

  ast = compile(`  a.length  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).not.toBe(true)
  }

  ast = compile(`  "123"[a]  `)

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.isStatic).not.toBe(true)
  }

})