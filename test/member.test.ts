import { compile } from 'yox-expression-compiler/src/compiler'

import * as nodeType from 'yox-expression-compiler/src/nodeType'

import Array from 'yox-expression-compiler/src/node/Array'
import Literal from 'yox-expression-compiler/src/node/Literal'
import Member from 'yox-expression-compiler/src/node/Member'
import Call from 'yox-expression-compiler/src/node/Call'
import Identifier from 'yox-expression-compiler/src/node/Identifier'

test('member', () => {

  let ast = compile('  "xx".length   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.LITERAL)
    expect(((ast as Member).lead as Literal).value).toBe('xx')
    expect((ast as Member).lead.raw).toBe('"xx"')

    expect((ast as Member).keypath).toBe('length')
    expect((ast as Member).nodes).toBe(undefined)

    expect((ast as Member).root).toBe(false)
    expect((ast as Member).lookup).toBe(true)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('"xx".length')
  }


  ast = compile('  "xx"[length]   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.LITERAL)
    expect(((ast as Member).lead as Literal).value).toBe('xx')
    expect((ast as Member).lead.raw).toBe('"xx"')

    expect((ast as Member).keypath).toBe(undefined)

    let nodes = (ast as Member).nodes
    expect(nodes != null).toBe(true)
    if (nodes) {
      expect(nodes.length).toBe(1)
      expect(nodes[0].type).toBe(nodeType.IDENTIFIER)
      expect((nodes[0] as Identifier).name).toBe('length')
    }

    expect((ast as Member).root).toBe(false)
    expect((ast as Member).lookup).toBe(true)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('"xx"[length]')
  }




  ast = compile('  [1,2,3].length   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.ARRAY)
    expect(((ast as Member).lead as Array).nodes.length).toBe(3)
    expect(((ast as Member).lead as Array).nodes[0].type).toBe(nodeType.LITERAL)
    expect((((ast as Member).lead as Array).nodes[0] as Literal).value).toBe(1)
    expect(((ast as Member).lead as Array).nodes[1].type).toBe(nodeType.LITERAL)
    expect((((ast as Member).lead as Array).nodes[1] as Literal).value).toBe(2)
    expect(((ast as Member).lead as Array).nodes[2].type).toBe(nodeType.LITERAL)
    expect((((ast as Member).lead as Array).nodes[2] as Literal).value).toBe(3)
    expect((ast as Member).lead.raw).toBe('[1,2,3]')

    expect((ast as Member).keypath).toBe('length')
    expect((ast as Member).nodes).toBe(undefined)

    expect((ast as Member).root).toBe(false)
    expect((ast as Member).lookup).toBe(true)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('[1,2,3].length')
  }




  ast = compile('  a[name]   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Member).lead as Identifier).name).toBe('a')
    expect(((ast as Member).lead as Identifier).root).toBe(false)
    expect(((ast as Member).lead as Identifier).lookup).toBe(true)
    expect(((ast as Member).lead as Identifier).offset).toBe(0)
    expect((ast as Member).lead.raw).toBe('a')

    expect((ast as Member).keypath).toBe(undefined)

    let nodes = (ast as Member).nodes
    expect(nodes != null).toBe(true)
    if (nodes) {
      expect(nodes.length).toBe(1)
      expect(nodes[0].type).toBe(nodeType.IDENTIFIER)
      expect((nodes[0] as Identifier).name).toBe('name')
    }

    expect((ast as Member).root).toBe(false)
    expect((ast as Member).lookup).toBe(true)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('a[name]')
  }


  ast = compile('  this.a[name]   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Member).lead as Identifier).name).toBe('a')
    expect(((ast as Member).lead as Identifier).root).toBe(false)
    expect(((ast as Member).lead as Identifier).lookup).toBe(false)
    expect(((ast as Member).lead as Identifier).offset).toBe(0)
    expect((ast as Member).lead.raw).toBe('this.a')

    expect((ast as Member).keypath).toBe(undefined)

    let nodes = (ast as Member).nodes
    expect(nodes != null).toBe(true)
    if (nodes) {
      expect(nodes.length).toBe(1)
      expect(nodes[0].type).toBe(nodeType.IDENTIFIER)
      expect((nodes[0] as Identifier).name).toBe('name')
    }

    expect((ast as Member).root).toBe(false)
    expect((ast as Member).lookup).toBe(false)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('this.a[name]')
  }


  ast = compile('  ../a[name]   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Member).lead as Identifier).name).toBe('a')
    expect(((ast as Member).lead as Identifier).root).toBe(false)
    expect(((ast as Member).lead as Identifier).lookup).toBe(false)
    expect(((ast as Member).lead as Identifier).offset).toBe(1)
    expect((ast as Member).lead.raw).toBe('../a')

    expect((ast as Member).keypath).toBe(undefined)

    let nodes = (ast as Member).nodes
    expect(nodes != null).toBe(true)
    if (nodes) {
      expect(nodes.length).toBe(1)
      expect(nodes[0].type).toBe(nodeType.IDENTIFIER)
      expect((nodes[0] as Identifier).name).toBe('name')
    }

    expect((ast as Member).root).toBe(false)
    expect((ast as Member).lookup).toBe(false)
    expect((ast as Member).offset).toBe(1)

    expect(ast.raw).toBe('../a[name]')
  }

  ast = compile('  ../../a[name]   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Member).lead as Identifier).name).toBe('a')
    expect(((ast as Member).lead as Identifier).root).toBe(false)
    expect(((ast as Member).lead as Identifier).lookup).toBe(false)
    expect(((ast as Member).lead as Identifier).offset).toBe(2)
    expect((ast as Member).lead.raw).toBe('../../a')

    expect((ast as Member).keypath).toBe(undefined)

    let nodes = (ast as Member).nodes
    expect(nodes != null).toBe(true)
    if (nodes) {
      expect(nodes.length).toBe(1)
      expect(nodes[0].type).toBe(nodeType.IDENTIFIER)
      expect((nodes[0] as Identifier).name).toBe('name')
    }

    expect((ast as Member).root).toBe(false)
    expect((ast as Member).lookup).toBe(false)
    expect((ast as Member).offset).toBe(2)

    expect(ast.raw).toBe('../../a[name]')
  }


  ast = compile('  ~/a[name]   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Member).lead as Identifier).name).toBe('a')
    expect(((ast as Member).lead as Identifier).root).toBe(true)
    expect(((ast as Member).lead as Identifier).lookup).toBe(false)
    expect(((ast as Member).lead as Identifier).offset).toBe(0)
    expect((ast as Member).lead.raw).toBe('~/a')

    expect((ast as Member).keypath).toBe(undefined)

    let nodes = (ast as Member).nodes
    expect(nodes != null).toBe(true)
    if (nodes) {
      expect(nodes.length).toBe(1)
      expect(nodes[0].type).toBe(nodeType.IDENTIFIER)
      expect((nodes[0] as Identifier).name).toBe('name')
    }

    expect((ast as Member).root).toBe(true)
    expect((ast as Member).lookup).toBe(false)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('~/a[name]')
  }


  ast = compile('  a.b.c()[name]   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.CALL)
    expect(((ast as Member).lead as Call).name.type).toBe(nodeType.IDENTIFIER)
    expect((((ast as Member).lead as Call).name as Identifier).name).toBe('a.b.c')
    expect((((ast as Member).lead as Call).name as Identifier).lookup).toBe(true)
    expect((((ast as Member).lead as Call).name as Identifier).offset).toBe(0)
    expect((((ast as Member).lead as Call).name as Identifier).raw).toBe('a.b.c')
    expect((ast as Member).lead.raw).toBe('a.b.c()')

    expect((ast as Member).keypath).toBe(undefined)

    let nodes = (ast as Member).nodes
    expect(nodes != null).toBe(true)
    if (nodes) {
      expect(nodes.length).toBe(1)
      expect(nodes[0].type).toBe(nodeType.IDENTIFIER)
      expect((nodes[0] as Identifier).name).toBe('name')
    }

    expect((ast as Member).lookup).toBe(true)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('a.b.c()[name]')
  }


})
