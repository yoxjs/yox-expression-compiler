import { generate } from 'yox-expression-compiler/src/generator'
import { compile } from 'yox-expression-compiler/src/compiler'
import Node from 'yox-expression-compiler/src/node/Node'
import * as generator from 'yox-common/src/util/generator'

const renderIdentifier = 'a'
const renderMemberKeypath = 'b'
const renderMemberLiteral = 'c'
const renderCall = 'd'

function generateValue(value: string, holder = false) {
  return generate(
    compile(value) as Node,
    renderIdentifier,
    renderMemberKeypath,
    renderMemberLiteral,
    renderCall,
    holder
  )
}

test('literal', () => {

  expect(generateValue('1')).toBe('1')
  expect(generateValue('0')).toBe('0')
  expect(generateValue('"1"')).toBe('"1"')
  expect(generateValue('true')).toBe(generator.TRUE)
  expect(generateValue('false')).toBe(generator.FALSE)
  expect(generateValue('null')).toBe(generator.NULL)
  expect(generateValue('undefined')).toBe(generator.UNDEFINED)

})

test('identifier', () => {

  expect(generateValue('a')).toBe(`${renderIdentifier}("a",${generator.TRUE})`)

  expect(generateValue('a.b')).toBe(`${renderIdentifier}("a.b",${generator.TRUE})`)

  expect(generateValue('this')).toBe(`${renderIdentifier}("",${generator.FALSE})`)

  expect(generateValue('this.a')).toBe(`${renderIdentifier}("a",${generator.FALSE})`)

  expect(generateValue('../a')).toBe(`${renderIdentifier}("a",${generator.FALSE},1)`)

  expect(generateValue('../../../a')).toBe(`${renderIdentifier}("a",${generator.FALSE},3)`)

})

test('array', () => {

  expect(generateValue('[]')).toBe(`[]`)

  expect(generateValue('[null]')).toBe(`[${generator.NULL}]`)

  expect(generateValue('[undefined]')).toBe(`[${generator.UNDEFINED}]`)

  expect(generateValue('[1,     2]')).toBe(`[1,2]`)

  expect(generateValue('["1", "2",2]')).toBe(`["1","2",2]`)

  expect(generateValue('[true,     false,1]')).toBe(`[${generator.TRUE},${generator.FALSE},1]`)

})

test('binary', () => {

  expect(generateValue('1 + 1')).toBe(`1+1`)

  expect(generateValue('1 + a')).toBe(`1+${renderIdentifier}("a",${generator.TRUE})`)
  expect(generateValue('1 + this.a')).toBe(`1+${renderIdentifier}("a",${generator.FALSE})`)

  expect(generateValue('1 + a * 2')).toBe(`1+${renderIdentifier}("a",${generator.TRUE})*2`)
  expect(generateValue('1 + a * 2 / b')).toBe(`1+${renderIdentifier}("a",${generator.TRUE})*2/${renderIdentifier}("b",${generator.TRUE})`)

})

test('call', () => {

  expect(generateValue('a()')).toBe(`${renderCall}(${renderIdentifier}("a",${generator.TRUE}))`)

  expect(generateValue('a.b()')).toBe(`${renderCall}(${renderIdentifier}("a.b",${generator.TRUE}))`)

})

test('member', () => {

  expect(generateValue('"xx".length')).toBe(`${renderMemberLiteral}("xx","length")`)
  expect(generateValue('"xx".a.b')).toBe(`${renderMemberLiteral}("xx","a.b")`)
  expect(generateValue('"xx"[a][b].c')).toBe(`${renderMemberLiteral}("xx",${generator.UNDEFINED},[${renderIdentifier}("a",${generator.TRUE}),${renderIdentifier}("b",${generator.TRUE}),"c"])`)

  expect(generateValue('format().a.b')).toBe(`${renderMemberLiteral}(${renderCall}(${renderIdentifier}("format",${generator.TRUE})),"a.b")`)
})

test("object", () => {

  expect(generateValue('{ "name": "yox", age: 1 }')).toBe(`{"name":"yox","age":1}`)

  expect(generateValue('{ "name": "yox", age: a }')).toBe(`{"name":"yox","age":${renderIdentifier}("a",${generator.TRUE})}`)

})

test('ternary', () => {

  expect(generateValue('a ? b : c')).toBe(`${renderIdentifier}("a",${generator.TRUE})?${renderIdentifier}("b",${generator.TRUE}):${renderIdentifier}("c",${generator.TRUE})`)

})

test('unary', () => {

  expect(generateValue('!!a')).toBe(`!!${renderIdentifier}("a",${generator.TRUE})`)
  expect(generateValue('+a')).toBe(`+${renderIdentifier}("a",${generator.TRUE})`)
  expect(generateValue('-a')).toBe(`-${renderIdentifier}("a",${generator.TRUE})`)
  expect(generateValue('~a')).toBe(`~${renderIdentifier}("a",${generator.TRUE})`)
  expect(generateValue('!a')).toBe(`!${renderIdentifier}("a",${generator.TRUE})`)

  expect(generateValue('!a', true)).toBe(`{value:!${renderIdentifier}("a",${generator.TRUE},${generator.UNDEFINED},${generator.TRUE}).value}`)

})