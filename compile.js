
import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'
import * as string from 'yox-common/util/string'
import * as logger from 'yox-common/util/logger'

import * as operator from './src/operator'

import ArrayNode from './src/node/Array'
import BinaryNode from './src/node/Binary'
import CallNode from './src/node/Call'
import TernaryNode from './src/node/Ternary'
import IdentifierNode from './src/node/Identifier'
import LiteralNode from './src/node/Literal'
import MemberNode from './src/node/Member'
import UnaryNode from './src/node/Unary'


// 区分关键字和普通变量
// 举个例子：a === true
// 从解析器的角度来说，a 和 true 是一样的 token
const keywords = { }
// 兼容 IE8
keywords[ 'true' ] = env.TRUE
keywords[ 'false' ] = env.FALSE
keywords[ 'null' ] = env.NULL
keywords[ 'undefined' ] = env.UNDEFINED

// 缓存编译结果
let compileCache = { }

/**
 * 是否是数字
 *
 * @param {number} charCode
 * @return {boolean}
 */
function isDigit(charCode) {
  return charCode >= 48
    && charCode <= 57 // 0...9
}

/**
 * 变量开始字符必须是 字母、下划线、$
 *
 * @param {number} charCode
 * @return {boolean}
 */
function isIdentifierStart(charCode) {
  return charCode === 36 // $
    || charCode === 95   // _
    || (charCode >= 97 && charCode <= 122) // a...z
    || (charCode >= 65 && charCode <= 90)  // A...Z
}

/**
 * 变量剩余的字符必须是 字母、下划线、$、数字
 *
 * @param {number} charCode
 * @return {boolean}
 */
function isIdentifierPart(charCode) {
  return isIdentifierStart(charCode) || isDigit(charCode)
}

/**
 * 把表达式编译成抽象语法树
 *
 * @param {string} content 表达式字符串
 * @return {Object}
 */
export default function compile(content) {

  if (compileCache[ content ]) {
    return compileCache[ content ]
  }

  let { length } = content
  let index = 0, charCode

  let throwError = function () {
    logger.fatal(`Failed to compile expression: ${char.CHAR_BREAKLINE}${content}`)
  }

  let getCharCode = function () {
    return char.codeAt(content, index)
  }

  let cutString = function (start) {
    return content.substring(start, index)
  }

  let skipWhitespace = function () {
    while ((charCode = getCharCode())
      && (charCode === char.CODE_WHITESPACE || charCode === char.CODE_TAB)
    ) {
      index++
    }
  }

  let skipNumber = function () {
    if (getCharCode() === char.CODE_DOT) {
      skipDecimal()
    }
    else {
      skipDigit()
      if (getCharCode() === char.CODE_DOT) {
        skipDecimal()
      }
    }
  }

  let skipDigit = function () {
    do {
      index++
    }
    while (isDigit(getCharCode()))
  }

  let skipDecimal = function () {
    // 跳过点号
    index++
    // 后面必须紧跟数字
    if (isDigit(getCharCode())) {
      skipDigit()
    }
    else {
      throwError()
    }
  }

  let skipString = function () {

    let quote = getCharCode()

    // 跳过引号
    index++
    while (index < length) {
      index++
      if (char.codeAt(content, index - 1) === quote) {
        return
      }
    }

    throwError()

  }

  let skipIdentifier = function () {
    // 第一个字符一定是经过 isIdentifierStart 判断的
    // 因此循环至少要执行一次
    do {
      index++
    }
    while (isIdentifierPart(getCharCode()))
  }

  let parseIdentifier = function (careKeyword) {

    let start = index
    skipIdentifier()

    let literal = cutString(start)
    if (literal) {
      return careKeyword && object.has(keywords, literal)
        ? new LiteralNode(literal, keywords[ literal ])
        // this 也视为 IDENTIFIER
        : new IdentifierNode(literal, literal)
    }

    throwError()

  }

  let parseTuple = function (delimiter) {

    let list = [ ]

    // 跳过开始字符，如 [、(
    index++

    while (index < length) {
      charCode = getCharCode()
      if (charCode === delimiter) {
        index++
        return list
      }
      else if (charCode === char.CODE_COMMA) {
        index++
      }
      else {
        array.push(
          list,
          parseExpression()
        )
      }
    }

    throwError()

  }

  let parseOperator = function (sortedOperatorList) {
    skipWhitespace()

    let value = string.slice(content, index), match
    array.each(
      sortedOperatorList,
      function (prefix) {
        if (string.startsWith(value, prefix)) {
          match = prefix
          return env.FALSE
        }
      }
    )

    if (match) {
      index += match.length
      return match
    }
  }

  let parseVariable = function () {

    let start = index, node = parseIdentifier(env.TRUE), temp

    while (index < length) {
      // a(x)
      charCode = getCharCode()
      if (charCode === char.CODE_OPAREN) {
        temp = parseTuple(char.CODE_CPAREN)
        return new CallNode(
          cutString(start),
          node,
          temp
        )
      }
      // a.x
      else if (charCode === char.CODE_DOT) {
        index++
        temp = parseIdentifier()
        node = new MemberNode(
          cutString(start),
          node,
          new LiteralNode(
            temp.source,
            temp.name
          )
        )
      }
      // a[x]
      else if (charCode === char.CODE_OBRACK) {
        temp = parseExpression(char.CODE_CBRACK)
        node = new MemberNode(
          cutString(start),
          node,
          temp
        )
      }
      else {
        break
      }
    }

    return node

  }

  let parseToken = function () {

    skipWhitespace()

    charCode = getCharCode()

    let start = index, temp

    // 'xx' 或 "xx"
    if (charCode === char.CODE_SQUOTE || charCode === char.CODE_DQUOTE) {
      // 截出的字符串包含引号
      skipString()
      temp = cutString(start)
      return new LiteralNode(
        temp,
        string.slice(temp, 1, -1)
      )
    }
    // 1.1 或 .1
    else if (isDigit(charCode) || charCode === char.CODE_DOT) {
      skipNumber()
      temp = cutString(start)
      return new LiteralNode(
        temp,
        parseFloat(temp)
      )
    }
    // [xx, xx]
    else if (charCode === char.CODE_OBRACK) {
      temp = parseTuple(char.CODE_CBRACK)
      return new ArrayNode(
        cutString(start),
        temp
      )
    }
    // (xx)
    else if (charCode === char.CODE_OPAREN) {
      return parseExpression(char.CODE_CPAREN)
    }
    // 变量
    else if (isIdentifierStart(charCode)) {
      return parseVariable()
    }
    // 一元操作
    let action = parseOperator(operator.unaryList)
    if (action) {
      temp = parseToken()
      return new UnaryNode(
        cutString(start),
        action,
        temp
      )
    }
    throwError()
  }

  let parseBinary = function () {

    let stack = [ index, parseToken() ], right, next

    let createBinaryNode = function () {
      array.pop(stack)
      array.pop(stack)
      let action = array.pop(stack)
      let left = array.pop(stack)
      return new BinaryNode(
        cutString(array.last(stack)),
        left,
        action,
        right
      )
    }

    while (next = parseOperator(operator.binaryList)) {

      // 处理左边
      if (stack.length > 5 && operator.binaryMap[ next ] < stack[ stack.length - 3 ]) {
        right = array.pop(stack)
        array.push(
          stack,
          createBinaryNode()
        )
      }

      array.push(stack, next)
      array.push(stack, operator.binaryMap[ next ])
      array.push(stack, index)
      array.push(stack, parseToken())

    }

    // 处理右边
    // 右边只有等到所有 token 解析完成才能开始
    // 比如 a + b * c / d
    // 此时右边的优先级 >= 左边的优先级，因此可以脑残的直接逆序遍历

    right = array.pop(stack)
    while (stack.length > 4) {
      right = createBinaryNode()
    }

    return right

  }

  let parseExpression = function (delimiter) {

    // 主要是区分三元和二元表达式
    // 三元表达式可以认为是 3 个二元表达式组成的
    // test ? consequent : alternate

    // 跳过开始字符
    if (delimiter) {
      index++
    }

    // 保证调用 parseExpression() 之后无需再次调用 skipWhitespace()
    let start = index, test = parseBinary()
    skipWhitespace()

    if (getCharCode() === char.CODE_QUMARK) {
      index++

      let consequent = parseBinary()
      skipWhitespace()

      if (getCharCode() === char.CODE_COLON) {
        index++

        let alternate = parseBinary()
        skipWhitespace()

        return new TernaryNode(
          cutString(start),
          test,
          consequent,
          alternate
        )
      }
      else {
        throwError()
      }
    }

    if (delimiter) {
      if (getCharCode() === delimiter) {
        index++
      }
      else {
        throwError()
      }
    }

    return test

  }

  return compileCache[ content ] = parseExpression()

}
