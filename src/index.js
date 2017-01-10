
import executeFunction from 'yox-common/function/execute'

import * as is from 'yox-common/util/is'
import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'
import * as string from 'yox-common/util/string'
import * as logger from 'yox-common/util/logger'
import * as keypathUtil from 'yox-common/util/keypath'

import * as nodeType from './nodeType'
import * as operator from './operator'

import ArrayNode from './node/Array'
import BinaryNode from './node/Binary'
import CallNode from './node/Call'
import ConditionalNode from './node/Conditional'
import IdentifierNode from './node/Identifier'
import LiteralNode from './node/Literal'
import MemberNode from './node/Member'
import UnaryNode from './node/Unary'

/**
 * 把树形的 Member 节点转换成一维数组的形式
 *
 * @param {Member} node
 * @return {Array.<Node>}
 */
function flattenMember(node) {

  let result = [ ]

  let next
  do {
    next = node.object
    if (node.type === nodeType.MEMBER) {
      array.unshift(result, node.prop)
    }
    else {
      array.unshift(result, node)
    }
  }
  while (node = next)

  return result

}

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
      return `[${node.elements.map(recursion).join(char.CHAR_COMMA)}]`

    case nodeType.BINARY:
      return `${stringify(node.left)} ${node.operator} ${stringify(node.right)}`

    case nodeType.CALL:
      return `${stringify(node.callee)}(${node.args.map(recursion).join(char.CHAR_COMMA)})`

    case nodeType.CONDITIONAL:
      return `${stringify(node.test)} ? ${stringify(node.consequent)} : ${stringify(node.alternate)}`

    case nodeType.IDENTIFIER:
      return node.name

    case nodeType.LITERAL:
      return object.has(node, 'raw')
        ? node.raw
        : node.value

    case nodeType.MEMBER:
      return flattenMember(node)
        .map(
          function (node, index) {
            if (node.type === nodeType.LITERAL) {
              let { value } = node
              return is.numeric(value)
                ? `${char.CHAR_OBRACK}${value}${char.CHAR_CBRACK}`
                : `${char.CHAR_DOT}${value}`
            }
            else {
              node = stringify(node)
              return index > 0
                ? `${char.CHAR_OBRACK}${node}${char.CHAR_CBRACK}`
                : node
            }
          }
        )
        .join(char.CHAR_BLANK)

    case nodeType.UNARY:
      return `${node.operator}${stringify(node.arg)}`

    default:
      return char.CHAR_BLANK
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
      value = BinaryNode[ node.operator ](left.value, right.value)
      object.extend(deps, left.deps, right.deps)
      break

    case nodeType.CALL:
      result = execute(node.callee, context)
      deps = result.deps
      value = executeFunction(
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
        object.extend(deps, test.deps, consequent.deps)
      }
      else {
        alternate = execute(alternate, context)
        value = alternate.value
        object.extend(deps, test.deps, alternate.deps)
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
        flattenMember(node),
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
      value = UnaryNode[ node.operator ](result.value)
      deps = result.deps
      break
  }

  return { value, deps }

}

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
 * 用倒排 token 去匹配 content 的开始内容
 *
 * @param {string} content
 * @param {Array.<string>} sortedTokens 数组长度从大到小排序
 * @return {?string}
 */
function matchBestToken(content, sortedTokens) {
  let result
  array.each(
    sortedTokens,
    function (token) {
      if (string.startsWith(content, token)) {
        result = token
        return env.FALSE
      }
    }
  )
  return result
}

/**
 * 把表达式编译成抽象语法树
 *
 * @param {string} content 表达式字符串
 * @return {Object}
 */
export function compile(content) {

  if (object.has(compileCache, content)) {
    return compileCache[ content ]
  }

  let { length } = content
  let index = 0, charCode

  let getCharCode = function () {
    return char.codeAt(content, index)
  }
  let throwError = function () {
    logger.error(`Failed to compile expression: ${char.CHAR_BREAKLINE}${content}`)
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

    let literal = content.substring(index, (skipIdentifier(), index))
    if (literal) {
      return careKeyword && object.has(keywords, literal)
        ? new LiteralNode(keywords[ literal ])
        // this 也视为 IDENTIFIER
        : new IdentifierNode(literal)
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
    let literal = matchBestToken(content.slice(index), sortedOperatorList)
    if (literal) {
      index += literal.length
      return literal
    }
  }

  let parseVariable = function () {

    let node = parseIdentifier(env.TRUE)

    while (index < length) {
      // a(x)
      charCode = getCharCode()
      if (charCode === char.CODE_OPAREN) {
        return new CallNode(
          node,
          parseTuple(char.CODE_CPAREN)
        )
      }
      else {
        // a.x
        if (charCode === char.CODE_DOT) {
          index++
          node = new MemberNode(
            node,
            new LiteralNode(
              parseIdentifier().name
            )
          )
        }
        // a[x]
        else if (charCode === char.CODE_OBRACK) {
          node = new MemberNode(
            node,
            parseExpression(char.CODE_CBRACK)
          )
        }
        else {
          break
        }
      }
    }

    return node

  }

  let parseToken = function () {

    skipWhitespace()

    charCode = getCharCode()
    // 'xx' 或 "xx"
    if (charCode === char.CODE_SQUOTE || charCode === char.CODE_DQUOTE) {
      // 截出的字符串包含引号
      let value = content.substring(index, (skipString(), index))
      return new LiteralNode(
        value.slice(1, -1),
        value
      )
    }
    // 1.1 或 .1
    else if (isDigit(charCode) || charCode === char.CODE_DOT) {
      return new LiteralNode(
        // 写的是什么进制就解析成什么进制
        parseFloat(
          content.substring(index, (skipNumber(), index))
        )
      )
    }
    // [xx, xx]
    else if (charCode === char.CODE_OBRACK) {
      return new ArrayNode(
        parseTuple(char.CODE_CBRACK)
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
      return new UnaryNode(action, parseToken())
    }
    throwError()
  }

  let parseBinary = function () {

    let left = parseToken()
    let action = parseOperator(operator.binaryList)
    if (!action) {
      return left
    }

    let stack = [ left, action, operator.binaryMap[ action ], parseToken() ]
    let right, next

    while (next = parseOperator(operator.binaryList)) {

      // 处理左边
      if (stack.length > 3 && operator.binaryMap[ next ] < stack[ stack.length - 2 ]) {
        right = stack.pop()
        stack.pop()
        action = stack.pop()
        left = stack.pop()
        array.push(
          stack,
          new BinaryNode(left, action, right)
        )
      }

      array.push(
        stack,
        next,
        operator.binaryMap[ next ],
        parseToken()
      )

    }

    // 处理右边
    // 右边只有等到所有 token 解析完成才能开始
    // 比如 a + b * c / d
    // 此时右边的优先级 >= 左边的优先级，因此可以脑残的直接逆序遍历

    right = stack.pop()
    while (stack.length > 1) {
      stack.pop()
      action = stack.pop()
      left = stack.pop()
      right = new BinaryNode(left, action, right)
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
    let test = parseBinary()
    skipWhitespace()

    if (getCharCode() === char.CODE_QUMARK) {
      index++

      let consequent = parseBinary()
      skipWhitespace()

      if (getCharCode() === char.CODE_COLON) {
        index++

        let alternate = parseBinary()
        skipWhitespace()

        return new ConditionalNode(test, consequent, alternate)
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
