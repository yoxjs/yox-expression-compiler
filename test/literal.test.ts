import { compile } from 'yox-expression-compiler/src/compiler'

import * as nodeType from 'yox-expression-compiler/src/nodeType'

import Node from 'yox-expression-compiler/src/node/Node'
import Literal from 'yox-expression-compiler/src/node/Literal'

function assert(node: Node | void, value: any, raw: string) {
  expect(node != null).toBe(true)
  if (node) {
    expect(node.type).toBe(nodeType.LITERAL)
    expect((node as Literal).value).toBe(value)
    expect(node.raw).toBe(raw)
  }
}

test('literal', () => {

  assert(
    compile(' 1 '),
    1,
    '1'
  )

  assert(
    compile(' 1.01 '),
    1.01,
    '1.01'
  )

  assert(
    compile(' .01 '),
    0.01,
    '.01'
  )

  assert(
    compile(' -1 '),
    -1,
    '-1'
  )

  assert(
    compile(' "str" '),
    'str',
    '"str"'
  )

  assert(
    compile(' "2\'2" '),
    "2'2",
    '"2\'2"'
  )

  assert(
    compile(' true '),
    true,
    'true'
  )

  assert(
    compile(' false '),
    false,
    'false'
  )

  assert(
    compile(' undefined '),
    undefined,
    'undefined'
  )

  assert(
    compile(' null '),
    null,
    'null'
  )

})