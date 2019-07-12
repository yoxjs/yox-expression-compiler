
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

