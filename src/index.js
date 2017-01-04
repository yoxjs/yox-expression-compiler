
import * as is from 'yox-common/util/is'
import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'
import * as string from 'yox-common/util/string'
import * as logger from 'yox-common/util/logger'
import * as keypathUtil from 'yox-common/util/keypath'

import callFunction from 'yox-common/function/execute'

import * as util from './util'
import * as nodeType from './nodeType'
import * as operator from './operator'

import Array from './node/Array'
import Binary from './node/Binary'
import Call from './node/Call'
import Conditional from './node/Conditional'
import Identifier from './node/Identifier'
import Literal from './node/Literal'
import Member from './node/Member'
import Unary from './node/Unary'

// 分隔符
const COMMA  = 44 // ,
const PERIOD = 46 // .
const SQUOTE = 39 // '
const DQUOTE = 34 // "
const OPAREN = 40 // (
const CPAREN = 41 // )
const OBRACK = 91 // [
const CBRACK = 93 // ]
const QUMARK = 63 // ?
const COLON  = 58 // :

// 区分关键字和普通变量
// 举个例子：a === true
// 从解析器的角度来说，a 和 true 是一样的 token
const keywords = {
  'true': env.TRUE,
  'false': env.FALSE,
  'null': env.NULL,
  'undefined': env.UNDEFINED,
}

// 缓存编译结果
let cache = { }

/**
 * 序列化表达式
 *
 * @param {Node} node
 * @return {string}
 */
export function stringify(node) {

  let recursion = function (node) {
    return stringify(node)
  }

  switch (node.type) {
    case nodeType.ARRAY:
      return `[${node.elements.map(recursion).join(', ')}]`

    case nodeType.BINARY:
      return `${stringify(node.left)} ${node.operator} ${stringify(node.right)}`

    case nodeType.CALL:
      return `${stringify(node.callee)}(${node.args.map(recursion).join(', ')})`

    case nodeType.CONDITIONAL:
      return `${stringify(node.test)} ? ${stringify(node.consequent)} : ${stringify(node.alternate)}`

    case nodeType.IDENTIFIER:
      return node.name

    case nodeType.LITERAL:
      let { value } = node
      if (is.string(value)) {
        return value.indexOf('"') >= 0
          ? `'${value}'`
          : `"${value}"`
      }
      return value

    case nodeType.MEMBER:
      return Member.flatten(node)
        .map(
          function (node, index) {
            if (node.type === nodeType.LITERAL) {
              let { value } = node
              return is.numeric(value)
                ? `[${value}]`
                : `.${value}`
            }
            else {
              node = stringify(node)
              return index > 0
                ? `[${node}]`
                : node
            }
          }
        )
        .join(env.EMPTY)

    case nodeType.UNARY:
      return `${node.operator}${stringify(node.arg)}`
  }

}

/**
 * 表达式求值
 *
 * @param {Node} node
 * @param {Context} context
 * @return {*}
 */
export function execute(node, context) {

  let deps = { }, value, result

  switch (node.type) {
    case nodeType.ARRAY:
      value = [ ]
      array.each(
        node.elements,
        function (node) {
          result = execute(node, context)
          array.push(value, result.value)
          object.extend(deps, result.deps)
        }
      )
      break

    case nodeType.BINARY:
      let { left, right } = node
      left = execute(left, context)
      right = execute(right, context)
      value = Binary[node.operator](left.value, right.value)
      deps = object.extend(left.deps, right.deps)
      break

    case nodeType.CALL:
      result = execute(node.callee, context)
      deps = result.deps
      value = callFunction(
        result.value,
        env.NULL,
        node.args.map(
          function (node) {
            let result = execute(node, context)
            object.extend(deps, result.deps)
            return result.value
          }
        )
      )
      break

    case nodeType.CONDITIONAL:
      let { test, consequent, alternate } = node
      test = execute(test, context)
      if (test.value) {
        consequent = execute(consequent, context)
        value = consequent.value
        deps = object.extend(test.deps, consequent.deps)
      }
      else {
        alternate = execute(alternate, context)
        value = alternate.value
        deps = object.extend(test.deps, alternate.deps)
      }
      break

    case nodeType.IDENTIFIER:
      result = context.get(node.name)
      value = result.value
      deps[ result.keypath ] = value
      break

    case nodeType.LITERAL:
      value = node.value
      break

    case nodeType.MEMBER:
      let keys = [ ]
      array.each(
        Member.flatten(node),
        function (node, index) {
          let { type } = node
          if (type !== nodeType.LITERAL) {
            if (index > 0) {
              let result = execute(node, context)
              array.push(keys, result.value)
              object.extend(deps, result.deps)
            }
            else if (type === nodeType.IDENTIFIER) {
              array.push(keys, node.name)
            }
          }
          else {
            array.push(keys, node.value)
          }
        }
      )
      result = context.get(
        keypathUtil.stringify(keys)
      )
      value = result.value
      deps[ result.keypath ] = value
      break

    case nodeType.UNARY:
      result = execute(node.arg, context)
      value = Unary[node.operator](result.value)
      deps = result.deps
      break
  }

  return { value, deps }

}

/**
 * 把表达式编译成抽象语法树
 *
 * @param {string} content 表达式字符串
 * @return {Object}
 */
export function compile(content) {

  if (object.has(cache, content)) {
    return cache[content]
  }

  let { length } = content
  let index = 0, charCode, value

  let getChar = function () {
    return string.charAt(content, index)
  }
  let getCharCode = function () {
    return string.charCodeAt(content, index)
  }
  let throwError = function () {
    logger.error(`Failed to compile expression: ${env.BREAKLINE}${content}`)
  }

  let skipWhitespace = function () {
    while (util.isWhitespace(getCharCode())) {
      index++
    }
  }

  let skipNumber = function () {
    while (util.isNumber(getCharCode())) {
      index++
    }
  }

  let skipString = function () {
    let closed, quote = getCharCode()
    index++
    while (index < length) {
      index++
      if (string.charCodeAt(content, index - 1) === quote) {
        closed = env.TRUE
        break
      }
    }
    if (!closed) {
      return throwError()
    }
  }

  let skipIdentifier = function () {
    // 第一个字符一定是经过 isIdentifierStart 判断的
    // 因此循环至少要执行一次
    do {
      index++
    }
    while (util.isIdentifierPart(getCharCode()))
  }

  let parseNumber = function () {

    let start = index

    skipNumber()
    if (getCharCode() === PERIOD) {
      index++
      skipNumber()
    }

    return new Literal(
      parseFloat(
        content.substring(start, index)
      )
    )

  }

  let parseString = function () {

    let start = index

    skipString()

    return new Literal(
      content.substring(start + 1, index - 1)
    )

  }

  let parseIdentifier = function () {

    let start = index
    skipIdentifier()

    value = content.substring(start, index)
    if (object.has(keywords, value)) {
      return new Literal(
        keywords[value]
      )
    }

    // this 也视为 IDENTIFIER
    if (value) {
      return new Identifier(value)
    }

    throwError()

  }

  let parseTuple = function (delimiter) {

    let args = [ ], closed

    while (index < length) {
      charCode = getCharCode()
      if (charCode === delimiter) {
        index++
        closed = env.TRUE
        break
      }
      else if (charCode === COMMA) {
        index++
      }
      else {
        array.push(
          args,
          parseExpression()
        )
      }
    }

    if (closed) {
      return args
    }

    throwError()

  }

  let parseOperator = function (sortedOperatorList) {
    skipWhitespace()
    value = util.matchBestToken(content.slice(index), sortedOperatorList)
    if (value) {
      index += value.length
      return value
    }
  }

  let parseVariable = function () {

    value = parseIdentifier()

    while (index < length) {
      // a(x)
      charCode = getCharCode()
      if (charCode === OPAREN) {
        index++
        value = new Call(value, parseTuple(CPAREN))
        break
      }
      else {
        // a.x
        if (charCode === PERIOD) {
          index++
          value = new Member(
            value,
            new Literal(
              parseIdentifier().name
            )
          )
        }
        // a[x]
        else if (charCode === OBRACK) {
          index++
          value = new Member(
            value,
            parseSubexpression(CBRACK)
          )
        }
        else {
          break
        }
      }
    }

    return value

  }

  let parseToken = function () {
    skipWhitespace()

    charCode = getCharCode()
    // 'xx' 或 "xx"
    if (charCode === SQUOTE || charCode === DQUOTE) {
      return parseString()
    }
    // 1.1 或 .1
    else if (util.isNumber(charCode) || charCode === PERIOD) {
      return parseNumber()
    }
    // [xx, xx]
    else if (charCode === OBRACK) {
      index++
      return new Array(
        parseTuple(CBRACK)
      )
    }
    // (xx, xx)
    else if (charCode === OPAREN) {
      index++
      return parseSubexpression(CPAREN)
    }
    else if (util.isIdentifierStart(charCode)) {
      return parseVariable()
    }
    value = parseOperator(operator.unaryList)
    if (value) {
      return parseUnary(value)
    }
    throwError()
  }

  let parseUnary = function (op) {
    value = parseToken()
    if (value) {
      return new Unary(op, value)
    }
    throwError()
  }

  let parseBinary = function () {

    let left = parseToken()
    let op = parseOperator(operator.binaryList)
    if (!op) {
      return left
    }

    let right = parseToken()
    let stack = [ left, op, operator.binaryMap[op], right ]

    while (op = parseOperator(operator.binaryList)) {

      // 处理左边
      if (stack.length > 3 && operator.binaryMap[op] < stack[stack.length - 2]) {
        array.push(
          stack,
          new Binary(
            stack.pop(),
            (stack.pop(), stack.pop()),
            stack.pop()
          )
        )
      }

      right = parseToken()
      if (right) {
        array.push(
          stack,
          op,
          operator.binaryMap[op],
          right
        )
      }
      else {
        throwError()
      }

    }

    // 处理右边
    // 右边只有等到所有 token 解析完成才能开始
    // 比如 a + b * c / d
    // 此时右边的优先级 >= 左边的优先级，因此可以脑残的直接逆序遍历

    right = stack.pop()
    while (stack.length > 1) {
      right = new Binary(
        right,
        (stack.pop(), stack.pop()),
        stack.pop()
      )
    }

    return right

  }

  // (xx) 和 [xx] 都可能是子表达式，因此
  let parseSubexpression = function (delimiter) {
    value = parseExpression()
    if (getCharCode() === delimiter) {
      index++
      return value
    }
    throwError()
  }

  let parseExpression = function () {

    // 主要是区分三元和二元表达式
    // 三元表达式可以认为是 3 个二元表达式组成的
    // test ? consequent : alternate

    let test = parseBinary()

    skipWhitespace()
    if (getCharCode() === QUMARK) {
      index++

      let consequent = parseBinary()

      skipWhitespace()
      if (getCharCode() === COLON) {
        index++

        let alternate = parseBinary()

        // 保证调用 parseExpression() 之后无需再次调用 skipWhitespace()
        skipWhitespace()
        return new Conditional(
          test,
          consequent,
          alternate,
        )
      }
      else {
        throwError()
      }
    }

    return test

  }

  return cache[content] = parseExpression()

}
