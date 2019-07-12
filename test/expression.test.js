
var compile = require('../dist/compiler').compile
var execute = require('../dist/executor').execute
var nodeType = require('../dist/nodeType')

var object = require('yox-common/dist/util/object')

it('报错', () => {
  let hasError = false
  try {
    compile('open())')
  }
  catch {
    hasError = true
  }
  expect(hasError).toBe(true)
})

it('identifier', () => {

  let ast = compile('    name    ')

  expect(ast != null).toBe(true)
  if (ast) {
    let data = { name: 'yox' }
    let get = function (keypath) {
      return object.get(data, keypath).value
    }

    expect(execute(ast, get)).toBe(data.name)
    expect(ast.sk).toBe('name')
    expect(ast.raw).toBe('name')
  }

})

it('path', () => {

  let ast = compile(' ../../this ')

  expect(ast.type).toBe(nodeType.IDENTIFIER)
  expect(ast.raw).toBe('../../this')
  expect(ast.lookup).toBe(false)
  expect(ast.offset).toBe(2)
  expect(ast.name).toBe('')
  expect(ast.sk).toBe('')

  ast = compile(' ../../a ')

  expect(ast.type).toBe(nodeType.IDENTIFIER)
  expect(ast.raw).toBe('../../a')
  expect(ast.lookup).toBe(false)
  expect(ast.offset).toBe(2)
  expect(ast.name).toBe('a')
  expect(ast.sk).toBe('a')

  ast = compile(' ../../a.b ')

  expect(ast.type).toBe(nodeType.MEMBER)
  expect(ast.raw).toBe('../../a.b')
  expect(ast.lookup).toBe(false)
  expect(ast.offset).toBe(2)
  expect(ast.sk).toBe('a.b')
  expect(ast.props[0].type).toBe(nodeType.IDENTIFIER)
  expect(ast.props[0].raw).toBe('a')
  expect(ast.props[0].name).toBe('a')
  expect(ast.props[0].lookup).toBe(false)
  expect(ast.props[0].offset).toBe(2)
  expect(ast.props[0].sk).toBe('a')

  expect(ast.props[1].type).toBe(nodeType.LITERAL)
  expect(ast.props[1].value).toBe('b')

  ast = compile(' this.a[x].b ')
  expect(ast.type).toBe(nodeType.MEMBER)
  expect(ast.raw).toBe('this.a[x].b')
  expect(ast.lookup).toBe(false)
  expect(ast.offset).toBe(undefined)
  expect(ast.sk).toBe(undefined)
  expect(ast.props[0].type).toBe(nodeType.IDENTIFIER)
  expect(ast.props[0].name).toBe('a')
  expect(ast.props[0].lookup).toBe(false)
  expect(ast.props[0].offset).toBe(undefined)
  expect(ast.props[0].sk).toBe('a')

  expect(ast.props[1].type).toBe(nodeType.IDENTIFIER)
  expect(ast.props[1].name).toBe('x')
  expect(ast.props[1].lookup).toBe(undefined)
  expect(ast.props[1].offset).toBe(undefined)
  expect(ast.props[1].sk).toBe('x')

  expect(ast.props[2].type).toBe(nodeType.LITERAL)
  expect(ast.props[2].value).toBe('b')

  ast = compile(' this.a[this.b] ')
  console.log(ast)
  expect(ast.type).toBe(nodeType.MEMBER)
  expect(ast.raw).toBe('this.a[this.b]')
  expect(ast.lookup).toBe(false)
  expect(ast.offset).toBe(undefined)
  expect(ast.sk).toBe(undefined)
  expect(ast.props[0].type).toBe(nodeType.IDENTIFIER)
  expect(ast.props[0].name).toBe('a')
  expect(ast.props[0].lookup).toBe(false)
  expect(ast.props[0].offset).toBe(undefined)
  expect(ast.props[0].sk).toBe('a')

  expect(ast.props[1].type).toBe(nodeType.IDENTIFIER)
  expect(ast.props[1].name).toBe('b')
  expect(ast.props[1].lookup).toBe(false)
  expect(ast.props[1].offset).toBe(undefined)
  expect(ast.props[1].sk).toBe('b')

})

it('prop', () => {

  let ast = compile('    "11".length    ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(2)
    expect(ast.raw).toBe('"11".length')
  }

  ast = compile('    [1,2,3].length    ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(3)
    expect(ast.raw).toBe('[1,2,3].length')
  }

})

it('member', () => {

  let data = {
    user: {
      name: 'yox'
    },
    which: 'name',
    list: [ 1, [ 2 ] ]
  }
  let get = function (keypath) {
    if (keypath === '') {
      return data
    }
    return object.get(data, keypath).value
  }
  let ast

  ast = compile('  user.name   ')
  expect(execute(ast, get)).toBe(data.user.name)
  expect(ast.sk).toBe('user.name')
  expect(ast.raw).toBe('user.name')

  ast = compile('  this.user   ')
  expect(execute(ast, get)).toBe(data.user)
  expect(ast.lookup).toBe(false)
  expect(ast.offset).toBe(undefined)
  expect(ast.sk).toBe(`user`)
  expect(ast.raw).toBe('this.user')

  // 语法上没有错，虽然不这么写
  ast = compile('  this.this   ')
  expect(execute(ast, get)).toBe(data)
  expect(ast.lookup).toBe(false)
  expect(ast.offset).toBe(undefined)
  expect(ast.sk).toBe(``)
  expect(ast.raw).toBe('this.this')

  ast = compile('   list.0')
  expect(execute(ast, get)).toBe(data.list[ 0 ])
  expect(ast.sk).toBe('list.0')
  expect(ast.raw).toBe('list.0')

  ast = compile('list.1.0   ')
  expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
  expect(ast.sk).toBe('list.1.0')
  expect(ast.raw).toBe('list.1.0')

  ast = compile('  list[ 0 ]  ')
  expect(execute(ast, get)).toBe(data.list[ 0 ])
  expect(ast.sk).toBe('list.0')
  expect(ast.raw).toBe('list[ 0 ]')

  ast = compile('  list[ 1 ][ 0 ]  ')
  expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
  expect(ast.sk).toBe('list.1.0')
  expect(ast.raw).toBe('list[ 1 ][ 0 ]')

  ast = compile('  list[ "1"    ][ "0"    ]  ')
  expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
  expect(ast.sk).toBe('list.1.0')
  expect(ast.raw).toBe('list[ "1"    ][ "0"    ]')

  ast = compile(' user[    which ] ')
  expect(execute(ast, get)).toBe(data.user.name)
  expect(ast.sk).toBe(undefined)
  expect(ast.raw).toBe('user[    which ]')



})

it('unary', () => {

  let data = { a: false, b: 2, c: '2' }
  let get = function (keypath) {
    return object.get(data, keypath).value
  }

  let ast

  ast = compile(' + true ')
  expect(execute(ast, get)).toBe(+true)
  expect(ast.raw).toBe('+ true')

  ast = compile(' + c ')
  expect(execute(ast, get)).toBe(+data.c)
  expect(ast.raw).toBe('+ c')

  ast = compile(' -c ')
  expect(execute(ast, get)).toBe(-data.c)
  expect(ast.raw).toBe('-c')

  ast = compile(' ~c ')
  expect(execute(ast, get)).toBe(~data.c)
  expect(ast.raw).toBe('~c')

  ast = compile(' ~ "0.1" ')
  expect(execute(ast, get)).toBe(~"0.1")
  expect(ast.raw).toBe('~ "0.1"')

  ast = compile(' !a ')
  expect(execute(ast, get)).toBe(true)
  expect(ast.raw).toBe('!a')

  ast = compile(' ! true    ')
  expect(execute(ast, get)).toBe(!true)
  expect(ast.raw).toBe('! true')

  ast = compile(' !!c ')
  expect(execute(ast, get)).toBe(!!data.c)
  expect(ast.raw).toBe('!!c')

})

it('binary', () => {

  let data = { a: false, b: 2, c: 1, d: '2' }
  let get = function (keypath) {
    return object.get(data, keypath).value
  }

  let ast

  ast = compile(' b * c ')
  expect(execute(ast, get)).toBe(data.b * data.c)
  expect(ast.raw).toBe('b * c')

  ast = compile(' b / c ')
  expect(execute(ast, get)).toBe(data.b / data.c)
  expect(ast.raw).toBe('b / c')

  ast = compile(' b % c ')
  expect(execute(ast, get)).toBe(data.b % data.c)
  expect(ast.raw).toBe('b % c')

  ast = compile('   b + c  ')
  expect(execute(ast, get)).toBe(data.b + data.c)
  expect(ast.raw).toBe('b + c')

  ast = compile(' b - c ')
  expect(execute(ast, get)).toBe(data.b - data.c)
  expect(ast.raw).toBe('b - c')

  ast = compile(' b << c ')
  expect(execute(ast, get)).toBe(data.b << data.c)
  expect(ast.raw).toBe('b << c')

  ast = compile(' b >> c ')
  expect(execute(ast, get)).toBe(data.b >> data.c)
  expect(ast.raw).toBe('b >> c')

  ast = compile(' b >>> c ')
  expect(execute(ast, get)).toBe(data.b >>> data.c)
  expect(ast.raw).toBe('b >>> c')

  ast = compile(' b < c ')
  expect(execute(ast, get)).toBe(data.b < data.c)
  expect(ast.raw).toBe('b < c')

  ast = compile(' b <= c ')
  expect(execute(ast, get)).toBe(data.b <= data.c)
  expect(ast.raw).toBe('b <= c')

  ast = compile(' b > c ')
  expect(execute(ast, get)).toBe(data.b > data.c)
  expect(ast.raw).toBe('b > c')

  ast = compile(' b >= c ')
  expect(execute(ast, get)).toBe(data.b >= data.c)
  expect(ast.raw).toBe('b >= c')

  ast = compile(' b == c ')
  expect(execute(ast, get)).toBe(data.b == data.c)
  expect(ast.raw).toBe('b == c')

  ast = compile(' b != c ')
  expect(execute(ast, get)).toBe(data.b != data.c)
  expect(ast.raw).toBe('b != c')

  ast = compile(' b === c ')
  expect(execute(ast, get)).toBe(data.b === data.c)
  expect(ast.raw).toBe('b === c')

  ast = compile(' b !== c ')
  expect(execute(ast, get)).toBe(data.b !== data.c)
  expect(ast.raw).toBe('b !== c')

  ast = compile(' b & c ')
  expect(execute(ast, get)).toBe(data.b & data.c)
  expect(ast.raw).toBe('b & c')

  ast = compile(' b ^ c ')
  expect(execute(ast, get)).toBe(data.b ^ data.c)
  expect(ast.raw).toBe('b ^ c')

  ast = compile(' b | c ')
  expect(execute(ast, get)).toBe(data.b | data.c)
  expect(ast.raw).toBe('b | c')

  ast = compile(' b && c ')
  expect(execute(ast, get)).toBe(data.b && data.c)
  expect(ast.raw).toBe('b && c')

  ast = compile(' b || c ')
  expect(execute(ast, get)).toBe(data.b || data.c)
  expect(ast.raw).toBe('b || c')

  ast = compile(' b + c * b ')
  expect(execute(ast, get)).toBe(data.b + data.c * data.b)
  expect(ast.raw).toBe('b + c * b')

  ast = compile(' b + c * b / c + b * c + c ')
  expect(execute(ast, get)).toBe(data.b + data.c * data.b / data.c + data.b * data.c + data.c)
  expect(ast.raw).toBe('b + c * b / c + b * c + c')

})

it('ternary', () => {

  let data = { a: true }
  let get = function (keypath) {
    return object.get(data, keypath).value
  }

  let ast = compile(' a ? 1 : 0 ')
  expect(execute(ast, get)).toBe(data.a ? 1 : 0)
  expect(ast.raw).toBe('a ? 1 : 0')

})

it('object', () => {

  let data = { a: false, b: 2, c: 1, d: '2' }
  let get = function (keypath) {
    return object.get(data, keypath).value
  }

  let ast = compile('{ a : 1 }')
  expect(execute(ast, get).a).toBe(1)
  expect(ast.raw).toBe('{ a : 1 }')

  ast = compile('{ a: a }')
  expect(execute(ast, get).a).toBe(false)
  expect(ast.raw).toBe('{ a: a }')

  ast = compile('{ 1: a }')
  expect(execute(ast, get)['1']).toBe(false)
  expect(ast.raw).toBe('{ 1: a }')

  ast = compile('{ "b": a }')
  expect(execute(ast, get)['b']).toBe(false)
  expect(ast.raw).toBe('{ "b": a }')

  ast = compile(' { sum: b + c } ')
  expect(execute(ast, get).sum).toBe(3)
  expect(ast.raw).toBe('{ sum: b + c }')

})

it('不支持的表达式', () => {

  let hasError = false

  try {
    compile('a--')
  }
  catch {
    hasError = true
  }
  expect(hasError).toBe(true)

  hasError = false

  try {
    compile('a++')
  }
  catch {
    hasError = true
  }
  expect(hasError).toBe(true)

  hasError = false

  try {
    compile('--a')
  }
  catch {
    hasError = true
  }
  expect(hasError).toBe(true)

  hasError = false

  try {
    compile('--a')
  }
  catch {
    hasError = true
  }
  expect(hasError).toBe(true)

})

it('demo1', () => {

  let ast = compile('a.b["u" + "ser"].d + 2')

  let data = {
    a: {
      b: {
        user: {
          d: 2,
        }
      }
    },
    c: 'user'
  }

  let result = execute(
    ast,
    function (keypath) {
      return object.get(data, keypath).value
    }
  )

  expect(result).toBe(4)

})

