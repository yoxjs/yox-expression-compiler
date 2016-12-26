
import * as is from 'yox-common/util/is'
import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'
import * as string from 'yox-common/util/string'

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
const keyword = {
  'true': env.TRUE,
  'false': env.FALSE,
  'null': env.NULL,
  'undefined': env.UNDEFINED,
}

// 编译结果缓存
let cache = { }

/**
 * 把表达式编译成抽象语法树
 *
 * @param {string} content 表达式字符串
 * @return {Object}
 */
export function compile(content) {

  let { length } = content
  let index = 0, charCode, value

  function getChar() {
    return string.charAt(content, index)
  }
  function getCharCode(i) {
    return string.charCodeAt(content, i != env.NULL ? i : index)
  }

  function skipWhitespace() {
    while (util.isWhitespace(getCharCode())) {
      index++
    }
  }

  function skipNumber() {
    while (util.isNumber(getCharCode())) {
      index++
    }
  }

  function skipString() {
    let closed, quote = getCharCode()
    index++
    while (index < length) {
      index++
      if (getCharCode(index - 1) === quote) {
        closed = env.TRUE
        break
      }
    }
    if (!closed) {
      return util.parseError(content)
    }
  }

  function skipIdentifier() {
    // 第一个字符一定是经过 isIdentifierStart 判断的
    // 因此循环至少要执行一次
    do {
      index++
    }
    while (util.isIdentifierPart(getCharCode()))
  }

  function parseNumber() {

    let start = index

    skipNumber()
    if (getCharCode() === PERIOD) {
      index++
      skipNumber()
    }

    return new Literal({
      value: parseFloat(
        content.substring(start, index)
      )
    })

  }

  function parseString() {

    let start = index

    skipString()

    return new Literal({
      value: content.substring(start + 1, index - 1)
    })

  }

  function parseIdentifier() {

    let start = index
    skipIdentifier()

    value = content.substring(start, index)
    if (keyword[value]) {
      return new Literal({
        value: keyword[value]
      })
    }

    // this 也视为 IDENTIFIER
    if (value) {
      return new Identifier({
        name: value,
      })
    }

    util.parseError(content)

  }

  function parseTuple(delimiter) {

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
        args.push(
          parseExpression()
        )
      }
    }

    if (closed) {
      return args
    }

    util.parseError(content)

  }

  function parseOperator(sortedOperatorList) {
    skipWhitespace()
    value = util.matchBestToken(content.slice(index), sortedOperatorList)
    if (value) {
      index += value.length
      return value
    }
  }

  function parseVariable() {

    value = parseIdentifier()

    while (index < length) {
      // a(x)
      charCode = getCharCode()
      if (charCode === OPAREN) {
        index++
        value = new Call({
          callee: value,
          args: parseTuple(CPAREN),
        })
        break
      }
      else {
        // a.x
        if (charCode === PERIOD) {
          index++
          value = new Member({
            object: value,
            property: new Literal({
              value: parseIdentifier().name,
            }),
          })
        }
        // a[x]
        else if (charCode === OBRACK) {
          index++
          value = new Member({
            object: value,
            property: parseSubexpression(CBRACK),
          })
        }
        else {
          break
        }
      }
    }

    return value

  }

  function parseToken() {
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
      return new Array({
        elements: parseTuple(CBRACK),
      })
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
    util.parseError(content)
  }

  function parseUnary(op) {
    value = parseToken()
    if (value) {
      return new Unary({
        operator: op,
        arg: value,
      })
    }
    util.parseError(content)
  }

  function parseBinary() {

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
        stack.push(
          new Binary({
            right: stack.pop(),
            operator: (stack.pop(), stack.pop()),
            left: stack.pop(),
          })
        )
      }

      right = parseToken()
      if (right) {
        stack.push(op, operator.binaryMap[op], right)
      }
      else {
        util.parseError(content)
      }

    }

    // 处理右边
    // 右边只有等到所有 token 解析完成才能开始
    // 比如 a + b * c / d
    // 此时右边的优先级 >= 左边的优先级，因此可以脑残的直接逆序遍历

    right = stack.pop()
    while (stack.length > 1) {
      right = new Binary({
        right: right,
        operator: (stack.pop(), stack.pop()),
        left: stack.pop(),
      })
    }

    return right

  }

  // (xx) 和 [xx] 都可能是子表达式，因此
  function parseSubexpression(delimiter) {
    value = parseExpression()
    if (getCharCode() === delimiter) {
      index++
      return value
    }
    util.parseError(content)
  }

  function parseExpression() {

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
        return new Conditional({
          test,
          consequent,
          alternate,
        })
      }
      else {
        util.parseError(content)
      }
    }

    return test

  }

  return cache[content] || (cache[content] = parseExpression())

}
