
import compile from '../compile'
import execute from '../execute'

import * as object from 'yox-common/util/object'

describe('expression', () => {

  it('literal', () => {

    let ast = compile(' 1 ')
    expect(execute(ast)).toBe(1)
    expect(ast.raw).toBe('1')

    ast = compile(' "str" ')
    expect(execute(ast)).toBe('str')
    expect(ast.raw).toBe('"str"')

    ast = compile(' true ')
    expect(execute(ast)).toBe(true)
    expect(ast.raw).toBe('true')

    ast = compile(' false ')
    expect(execute(ast)).toBe(false)
    expect(ast.raw).toBe('false')

    ast = compile('undefined ')
    expect(execute(ast)).toBe(undefined)
    expect(ast.raw).toBe('undefined')

    ast = compile(' null')
    expect(execute(ast)).toBe(null)
    expect(ast.raw).toBe('null')

  })

  it('identifier', () => {

    let ast = compile('    name    ')
    let data = { name: 'yox' }
    let get = function (keypath) {
      return object.get(data, keypath).value
    }

    expect(execute(ast, get)).toBe(data.name)
    expect(ast.keypath).toBe('name')
    expect(ast.raw).toBe('name')

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

    let ast = compile('  user.name   ')
    expect(execute(ast, get)).toBe(data.user.name)
    expect(ast.keypath).toBe('user.name')
    expect(ast.raw).toBe('user.name')

    ast = compile('  this.user   ')
    expect(execute(ast, get)).toBe(data.user)
    expect(ast.keypath).toBe('this.user')
    expect(ast.raw).toBe('this.user')

    ast = compile('   list.0')
    expect(execute(ast, get)).toBe(data.list[ 0 ])
    expect(ast.keypath).toBe('list.0')
    expect(ast.raw).toBe('list.0')

    ast = compile('list.1.0   ')
    expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
    expect(ast.keypath).toBe('list.1.0')
    expect(ast.raw).toBe('list.1.0')

    ast = compile('  list[ 0 ]  ')
    expect(execute(ast, get)).toBe(data.list[ 0 ])
    expect(ast.keypath).toBe('list.0')
    expect(ast.raw).toBe('list[ 0 ]')

    ast = compile('  list[ 1 ][ 0 ]  ')
    expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
    expect(ast.keypath).toBe('list.1.0')
    expect(ast.raw).toBe('list[ 1 ][ 0 ]')

    ast = compile('  list[ "1"    ][ "0"    ]  ')
    expect(execute(ast, get)).toBe(data.list[ 1 ][ 0 ])
    expect(ast.keypath).toBe('list.1.0')
    expect(ast.raw).toBe('list[ "1"    ][ "0"    ]')

    ast = compile(' user[    which ] ')
    expect(execute(ast, get)).toBe(data.user.name)
    expect(ast.keypath).toBe(undefined)
    expect(ast.raw).toBe('user[    which ]')

  })

  it('unary', () => {

    let data = { a: false, b: 2, c: '2' }
    let get = function (keypath) {
      return object.get(data, keypath).value
    }

    let ast = compile(' !a ')
    expect(execute(ast, get)).toBe(true)
    expect(ast.raw).toBe('!a')

    ast = compile(' +c ')
    expect(execute(ast, get)).toBe(+data.c)
    expect(ast.raw).toBe('+c')

    ast = compile(' -c ')
    expect(execute(ast, get)).toBe(-data.c)
    expect(ast.raw).toBe('-c')

    ast = compile(' ~c ')
    expect(execute(ast, get)).toBe(~data.c)
    expect(ast.raw).toBe('~c')

    ast = compile(' !!c ')
    expect(execute(ast, get)).toBe(!!data.c)
    expect(ast.raw).toBe('!!c')

  })

  it('binary', () => {

    let data = { a: false, b: 2, c: 1, d: '2' }
    let get = function (keypath) {
      return object.get(data, keypath).value
    }

    let ast = compile(' b + c ')
    expect(execute(ast, get)).toBe(data.b + data.c)
    expect(ast.raw).toBe('b + c')

    ast = compile(' b - c ')
    expect(execute(ast, get)).toBe(data.b - data.c)
    expect(ast.raw).toBe('b - c')

    ast = compile(' b * c ')
    expect(execute(ast, get)).toBe(data.b * data.c)
    expect(ast.raw).toBe('b * c')

    ast = compile(' b / c ')
    expect(execute(ast, get)).toBe(data.b / data.c)
    expect(ast.raw).toBe('b / c')

    ast = compile(' b % c ')
    expect(execute(ast, get)).toBe(data.b % data.c)
    expect(ast.raw).toBe('b % c')

  })

  it('object', () => {

    let data = { a: false, b: 2, c: 1, d: '2' }
    let get = function (keypath) {
      return object.get(data, keypath).value
    }

    let ast = compile('{ a: 1 }')
    expect(execute(ast, get).a).toBe(1)
    expect(ast.raw).toBe('{ a: 1 }')

    ast = compile('{ a: a }')
    expect(execute(ast, get).a).toBe(false)
    expect(ast.raw).toBe('{ a: false }')

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

})
