import { compile } from '../src/compiler'

import * as nodeType from '../src/nodeType'

import Literal from '../src/node/Literal'
import Member from '../src/node/Member'
import Identifier from '../src/node/Identifier'

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

    expect((ast as Member).lookup).toBe(true)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('"xx"[length]')
  }


  ast = compile('  a[name]   ')
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Member).lead as Identifier).name).toBe('a')
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

    expect((ast as Member).lookup).toBe(true)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('a[name]')
  }


  ast = compile('  this.a[name]   ')
  console.log(ast)
  expect(ast != null).toBe(true)
  if (ast) {
    expect(ast.type).toBe(nodeType.MEMBER)

    expect((ast as Member).lead.type).toBe(nodeType.IDENTIFIER)
    expect(((ast as Member).lead as Identifier).name).toBe('a')
    expect(((ast as Member).lead as Identifier).lookup).toBe(false)
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

    expect((ast as Member).lookup).toBe(true)
    expect((ast as Member).offset).toBe(0)

    expect(ast.raw).toBe('this.a[name]')
  }



})
