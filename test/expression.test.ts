
import { compile } from '../src/compiler'
import { execute } from '../src/executor'
import * as nodeType from '../src/nodeType'

import * as env from 'yox-common/util/env'
import * as object from 'yox-common/util/object'

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

it('literal', () => {

  let ast: any

  ast = compile(' 1 ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(1)
    expect(ast.raw).toBe('1')
  }

  ast = compile(' 1.01 ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(1.01)
    expect(ast.raw).toBe('1.01')
  }

  ast = compile(' .01 ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(0.01)
    expect(ast.raw).toBe('.01')
  }

  ast = compile(' -1 ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.LITERAL)
    expect(execute(ast)).toBe(-1)
    expect(ast.raw).toBe('-1')
  }

  ast = compile(' "str" ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe('str')
    expect(ast.raw).toBe('"str"')
  }

  ast = compile('  "2\'2"  ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe("2'2")
    expect(ast.raw).toBe('"2\'2"')
  }

  ast = compile(' true ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(true)
    expect(ast.raw).toBe('true')
  }

  ast = compile(' false ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(false)
    expect(ast.raw).toBe('false')
  }

  ast = compile('undefined ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(undefined)
    expect(ast.raw).toBe('undefined')
  }

  ast = compile(' null')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast)).toBe(null)
    expect(ast.raw).toBe('null')
  }

  ast = compile(' [1 , "2" , true] ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(Array.isArray(execute(ast))).toBe(true)
    expect(execute(ast).length).toBe(3)
    expect(execute(ast) !== execute(ast)).toBe(true)
    expect(ast.raw).toBe('[1 , "2" , true]')
  }

  ast = compile(' [1 , "2" , true, ]  ')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast).length).toBe(3)
  }

  ast = compile(' { name : "musicode", "age" : 100 }')

  expect(ast != null).toBe(true)
  if (ast) {
    expect(execute(ast).name).toBe('musicode')
    expect(execute(ast).age).toBe(100)
    expect(execute(ast) !== execute(ast)).toBe(true)
    expect(ast.raw).toBe('{ name : "musicode", "age" : 100 }')
  }

  ast = compile(' { name : "musicode", "age" : 100, }')
  expect(ast != null).toBe(true)

  ast = compile(' ')

  expect(ast).toBe(undefined)

})

it('identifier', () => {

  let ast = compile('    name    ')

  expect(ast != null).toBe(true)
  if (ast) {
    let data = { name: 'yox' }
    let get = function (keypath: string) {
      return object.get(data, keypath).value
    }

    expect(execute(ast, get)).toBe(data.name)
    expect(ast.staticKeypath).toBe('name')
    expect(ast.raw).toBe('name')
  }

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
    return object.get(data, keypath).value
  }
  let ast: any

  ast = compile('  user.name   ')
  expect(execute(ast, get)).toBe(data.user.name)
  expect(ast.staticKeypath).toBe('user.name')
  expect(ast.raw).toBe('user.name')

  ast = compile('  this.user   ')
  // expect(execute(ast, get)).toBe(data.user)
  expect(ast.staticKeypath).toBe(`${env.KEYPATH_PRIVATE_CURRENT}.user`)
  expect(ast.raw).toBe('this.user')

  ast = compile('   list.0')
  expect(execute(ast, get)).toBe(data.list[ 0 ])
  expect(ast.staticKeypath).toBe('list.0')
  expect(ast.raw).toBe('list.0')

  ast = compile('list.1.0   ')
  expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
  expect(ast.staticKeypath).toBe('list.1.0')
  expect(ast.raw).toBe('list.1.0')

  ast = compile('  list[ 0 ]  ')
  expect(execute(ast, get)).toBe(data.list[ 0 ])
  expect(ast.staticKeypath).toBe('list.0')
  expect(ast.raw).toBe('list[ 0 ]')

  ast = compile('  list[ 1 ][ 0 ]  ')
  expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
  expect(ast.staticKeypath).toBe('list.1.0')
  expect(ast.raw).toBe('list[ 1 ][ 0 ]')

  ast = compile('  list[ "1"    ][ "0"    ]  ')
  expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
  expect(ast.staticKeypath).toBe('list.1.0')
  expect(ast.raw).toBe('list[ "1"    ][ "0"    ]')

  ast = compile(' user[    which ] ')
  expect(execute(ast, get)).toBe(data.user.name)
  expect(ast.staticKeypath).toBe(undefined)
  expect(ast.raw).toBe('user[    which ]')

})

it('unary', () => {

  let data = { a: false, b: 2, c: '2' }
  let get = function (keypath) {
    return object.get(data, keypath).value
  }

  let ast: any

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

  let ast: any

  ast = compile('   b ** c  ')
  expect(execute(ast, get)).toBe(data.b ** data.c)
  expect(ast.raw).toBe('b ** c')

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

