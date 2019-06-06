import isDef from '../../yox-common/src/function/isDef'
import isUndef from '../../yox-common/src/function/isUndef'
import invoke from '../../yox-common/src/function/execute'

import * as env from '../../yox-common/src/util/env'
import * as array from '../../yox-common/src/util/array'
import * as object from '../../yox-common/src/util/object'
import * as keypathUtil from '../../yox-common/src/util/keypath'

import ValueHolder from '../../yox-type/src/interface/ValueHolder'

import * as nodeType from './nodeType'
import * as interpreter from './interpreter'

import Node from './node/Node'
import Keypath from './node/Keypath'
import Identifier from './node/Identifier'
import Literal from './node/Literal'
import Member from './node/Member'
import Ternary from './node/Ternary'
import Binary from './node/Binary'
import Unary from './node/Unary'
import Call from './node/Call'

import ArrayNode from './node/Array'
import ObjectNode from './node/Object'

type Getter = (keypath: string, node: Keypath) => ValueHolder

export function execute(node: Node, getter?: Getter, context?: any): ValueHolder {

  let holder = env.VALUE_HOLDER

  holder.keypath = env.UNDEFINED

  switch (node.type) {

    case nodeType.LITERAL:
      holder.value = (node as Literal).value
      break

    case nodeType.IDENTIFIER:
      return (getter as Getter)((node as Identifier).name, (node as Identifier))

    case nodeType.UNARY:
      holder.value = interpreter.unary[(node as Unary).op].x(
        execute((node as Unary).a, getter, context).value
      )
      break

    case nodeType.BINARY:
      holder.value = interpreter.binary[(node as Binary).op].x(
        execute((node as Binary).a, getter, context).value,
        execute((node as Binary).b, getter, context).value
      )
      break

    case nodeType.TERNARY:
      return execute((node as Ternary).test, getter, context).value
        ? execute((node as Ternary).yes, getter, context)
        : execute((node as Ternary).no, getter, context)

    case nodeType.ARRAY:
      holder.value = (node as ArrayNode).nodes.map(
        function (node) {
          return execute(node, getter, context).value
        }
      )
      break

    case nodeType.OBJECT:
      const result = {}
      array.each(
        (node as ObjectNode).keys,
        function (key: string, index: number) {
          result[key] = execute((node as ObjectNode).values[index], getter, context).value
        }
      )
      holder.value = result
      break

    case nodeType.CALL:
      holder.value = invoke(
        execute((node as Call).name, getter, context).value,
        context,
        (node as Call).args.map(
          function (node) {
            return execute(node, getter, context).value
          }
        )
      )
      break

    case nodeType.MEMBER:

      /**
       * 先说第一种奇葩情况：
       *
       * 'xx'.length
       *
       * 没有变量数据，直接执行字面量，这里用不上 getter
       *
       * 第二种：
       *
       * a.b.c
       *
       * 这是常规操作
       *
       * 第三种：
       *
       * 'xx'[name]
       *
       * 以字面量开头，后面会用到变量
       *
       */

      let staticKeypath = (node as Member).sk, props = (node as Member).props, first: any, data: any

      if (isUndef(staticKeypath)) {

        // props 至少两个，否则无法创建 Member
        first = props[0]

        if (first.type === nodeType.IDENTIFIER) {
          staticKeypath = (first as Identifier).name
        }
        else {
          staticKeypath = env.EMPTY_STRING
          data = execute(first, getter, context).value
        }

        for (let i = 1, len = props.length; i < len; i++) {
          staticKeypath = keypathUtil.join(
            staticKeypath,
            execute(props[i], getter, context).value
          )
        }

      }

      if (isDef(data)) {
        data = object.get(data, staticKeypath as string)
        holder.value = data ? data.value : env.UNDEFINED
      }
      else if (getter) {
        holder = getter(staticKeypath as string, (node as Member))
      }
      break
  }

  return holder

}
