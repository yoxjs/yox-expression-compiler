// import { generate } from 'yox-expression-compiler/src/generator'
// import { compile } from 'yox-expression-compiler/src/compiler'
// import Node from 'yox-expression-compiler/src/node/Node'
// import * as generator from 'yox-common/src/util/generator'

// const renderIdentifier = 'a'
// const renderMemberKeypath = 'b'
// const renderMemberLiteral = 'c'
// const renderCall = 'd'

// function generateValue(value: string, holder = false) {
//   return generate(
//     compile(value) as Node,
//     renderIdentifier,
//     renderMemberKeypath,
//     renderMemberLiteral,
//     renderCall,
//     holder
//   ).toString()
// }

// test('literal', () => {

//   expect(generateValue('1')).toBe('1')
//   expect(generateValue('0')).toBe('0')
//   expect(generateValue('"1"')).toBe('"1"')
//   expect(generateValue('true')).toBe(generator.TRUE)
//   expect(generateValue('false')).toBe(generator.FALSE)
//   expect(generateValue('null')).toBe(generator.NULL)
//   expect(generateValue('undefined')).toBe(generator.UNDEFINED)

// })

// test('identifier', () => {

//   expect(generateValue('a')).toBe(`${renderIdentifier}("a", ${generator.TRUE})`)

//   expect(generateValue('a.b')).toBe(`${renderIdentifier}("a.b", ${generator.TRUE})`)

//   expect(generateValue('this')).toBe(`${renderIdentifier}("", ${generator.FALSE})`)

//   expect(generateValue('this.a')).toBe(`${renderIdentifier}("a", ${generator.FALSE})`)

//   expect(generateValue('../a')).toBe(`${renderIdentifier}("a", ${generator.FALSE}, 1)`)

//   expect(generateValue('../../../a')).toBe(`${renderIdentifier}("a", ${generator.FALSE}, 3)`)


//   expect(generateValue('a', true)).toBe(`${renderIdentifier}("a", ${generator.TRUE}, ${generator.UNDEFINED}, ${generator.TRUE})`)

// })

// test('array', () => {

//   expect(generateValue('[]')).toBe(`[ ]`)
//   expect(generateValue('[,]')).toBe(`[ ]`)

//   expect(generateValue('[true]')).toBe(`[ ${generator.TRUE} ]`)
//   expect(generateValue('[false]')).toBe(`[ ${generator.FALSE} ]`)
//   expect(generateValue('[null]')).toBe(`[ ${generator.NULL} ]`)
//   expect(generateValue('[undefined]')).toBe(`[ ${generator.UNDEFINED} ]`)

//   expect(generateValue('[1,     2]')).toBe(`[ 1, 2 ]`)

//   expect(generateValue('["1", "2",2]')).toBe(`[ "1", "2", 2 ]`)

//   expect(generateValue('[true,     false,1]')).toBe(`[ ${generator.TRUE}, ${generator.FALSE}, 1 ]`)

// })

// test("object", () => {

//   expect(generateValue('{}')).toBe(`{ }`)

//   expect(generateValue('{ "name": "yox", age: 1 }')).toBe(`{ name: "yox", age: 1 }`)
//   expect(generateValue('{ "name": "yox", age: 2, }')).toBe(`{ name: "yox", age: 2 }`)
//   expect(generateValue('{ "name": "yox", age: true }')).toBe(`{ name: "yox", age: ${generator.TRUE} }`)
//   expect(generateValue('{ "name": "yox", age: false }')).toBe(`{ name: "yox", age: ${generator.FALSE} }`)
//   expect(generateValue('{ "name": "yox", age: null }')).toBe(`{ name: "yox", age: ${generator.NULL} }`)
//   expect(generateValue('{ "name": "yox", age: undefined }')).toBe(`{ name: "yox", age: ${generator.UNDEFINED} }`)

//   expect(generateValue('{ "name": "yox", "a-b": 1 }')).toBe(`{ name: "yox", "a-b": 1 }`)

//   expect(generateValue('{ "name": "yox", age: a }')).toBe(`{ name: "yox", age: ${renderIdentifier}("a", ${generator.TRUE}) }`)

// })

// test('unary', () => {

//   expect(generateValue('!!a')).toBe(`!!${renderIdentifier}("a", ${generator.TRUE})`)
//   expect(generateValue('+a')).toBe(`+${renderIdentifier}("a", ${generator.TRUE})`)
//   expect(generateValue('-a')).toBe(`-${renderIdentifier}("a", ${generator.TRUE})`)
//   expect(generateValue('~a')).toBe(`~${renderIdentifier}("a", ${generator.TRUE})`)
//   expect(generateValue('!a')).toBe(`!${renderIdentifier}("a", ${generator.TRUE})`)

//   expect(generateValue('!a', true)).toBe(`{ value: !${renderIdentifier}("a", ${generator.TRUE}) }`)

// })

// test('binary', () => {

//   expect(generateValue('1+1')).toBe(`1 + 1`)
//   expect(generateValue('1 +1')).toBe(`1 + 1`)
//   expect(generateValue('1+ 1')).toBe(`1 + 1`)
//   expect(generateValue(' 1+1 ')).toBe(`1 + 1`)
//   expect(generateValue(' 1+2*3 -4 / 5 + 6 ')).toBe(`1 + 2 * 3 - 4 / 5 + 6`)

//   expect(generateValue('1 + a')).toBe(`1 + ${renderIdentifier}("a", ${generator.TRUE})`)
//   expect(generateValue('1 + this.a')).toBe(`1 + ${renderIdentifier}("a", ${generator.FALSE})`)

//   expect(generateValue('1 + a * 2')).toBe(`1 + ${renderIdentifier}("a", ${generator.TRUE}) * 2`)
//   expect(generateValue('1 + a * 2 / b')).toBe(`1 + ${renderIdentifier}("a", ${generator.TRUE}) * 2 / ${renderIdentifier}("b", ${generator.TRUE})`)

// })

// test('ternary', () => {

//   expect(generateValue('1?2:3')).toBe(`1 ? 2 : 3`)
//   expect(generateValue('1?2:3 + 4')).toBe(`1 ? 2 : 3 + 4`)
//   expect(generateValue('1?2:3 + 4 * 5')).toBe(`1 ? 2 : 3 + 4 * 5`)
//   expect(generateValue('1?2:3 + 4 * 5 - 6')).toBe(`1 ? 2 : 3 + 4 * 5 - 6`)
//   expect(generateValue('1?2:(3 + 4) * 5 - 6')).toBe(`1 ? 2 : (3 + 4) * 5 - 6`)
//   expect(generateValue('1?2 - 3 * 4:(3 + 4) * 5 - 6')).toBe(`1 ? 2 - 3 * 4 : (3 + 4) * 5 - 6`)
//   expect(generateValue('1?(2 - 3) * 4:(3 + 4) * 5 - 6')).toBe(`1 ? (2 - 3) * 4 : (3 + 4) * 5 - 6`)

//   expect(generateValue('a ? b : c')).toBe(`${renderIdentifier}("a", ${generator.TRUE}) ? ${renderIdentifier}("b", ${generator.TRUE}) : ${renderIdentifier}("c", ${generator.TRUE})`)

//   expect(generateValue('a ? b : c', true)).toBe(`{ value: ${renderIdentifier}("a", ${generator.TRUE}) ? ${renderIdentifier}("b", ${generator.TRUE}) : ${renderIdentifier}("c", ${generator.TRUE}) }`)

// })

// test('call', () => {

//   expect(generateValue('a()')).toBe(`${renderCall}(${renderIdentifier}("a", ${generator.TRUE}))`)
//   expect(generateValue('a(1, 2)')).toBe(`${renderCall}(${renderIdentifier}("a", ${generator.TRUE}), [ 1, 2 ])`)
//   expect(generateValue('a(1, true,)')).toBe(`${renderCall}(${renderIdentifier}("a", ${generator.TRUE}), [ 1, ${generator.TRUE} ])`)
//   expect(generateValue('a(1, false,)')).toBe(`${renderCall}(${renderIdentifier}("a", ${generator.TRUE}), [ 1, ${generator.FALSE} ])`)
//   expect(generateValue('a(1, null,)')).toBe(`${renderCall}(${renderIdentifier}("a", ${generator.TRUE}), [ 1, ${generator.NULL} ])`)
//   expect(generateValue('a(1, undefined,)')).toBe(`${renderCall}(${renderIdentifier}("a", ${generator.TRUE}), [ 1, ${generator.UNDEFINED} ])`)

//   expect(generateValue('a.b()')).toBe(`${renderCall}(${renderIdentifier}("a.b", ${generator.TRUE}))`)

// })

// test('member', () => {

//   expect(generateValue('"xx".length')).toBe(`${renderMemberLiteral}("xx","length")`)
//   expect(generateValue('"xx".a.b')).toBe(`${renderMemberLiteral}("xx","a.b")`)
//   expect(generateValue('"xx"[a][b].c')).toBe(`${renderMemberLiteral}("xx",${generator.UNDEFINED},[${renderIdentifier}("a",${generator.TRUE}),${renderIdentifier}("b",${generator.TRUE}),"c"])`)

//   expect(generateValue('format().a.b')).toBe(`${renderMemberLiteral}(${renderCall}(${renderIdentifier}("format",${generator.TRUE})),"a.b")`)
// })



