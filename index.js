
import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'
import * as string from 'yox-common/util/string'
import * as logger from 'yox-common/util/logger'
import * as keypathUtil from 'yox-common/util/keypath'

import executeFunction from 'yox-common/function/execute'

import * as operator from './src/operator'
import * as nodeType from './src/nodeType'
import * as interpreter from './src/interpreter'

import ArrayNode from './src/node/Array'
import ObjectNode from './src/node/Object'
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

keywords[ env.RAW_TRUE ] = env.TRUE
keywords[ env.RAW_FALSE ] = env.FALSE
keywords[ env.RAW_NULL ] = env.NULL
keywords[ env.RAW_UNDEFINED ] = env.UNDEFINED

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
export function compile(content) {

  if (compileCache[ content ]) {
    return compileCache[ content ]
  }

  let length = content[ env.RAW_LENGTH ], index = 0, charCode

  let throwError = function () {
    logger.fatal(`Failed to compile expression: ${char.CHAR_BREAKLINE}${content}`)
  }

  let getCharCode = function () {
    return char.codeAt(content, index)
  }

  let getNextCharCode = function () {
    return char.codeAt(content, index + 1)
  }

  let cutString = function (start, end) {
    return content.substring(start, end == env.NULL ? index : end)
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

  let parseObject = function () {

    let keys = [ ], values = [ ], current = keys

    // 跳过开始字符 {
    index++

    while (index < length) {
      charCode = getCharCode()
      // }
      if (charCode === char.CODE_CBRACE) {
        index++
        if (keys[ env.RAW_LENGTH ] !== values[ env.RAW_LENGTH ]) {
          throwError()
        }
        return {
          keys: keys.map(
            function (item) {
              if (item.type === nodeType.IDENTIFIER) {
                return item.name
              }
              else if (item.type === nodeType.LITERAL) {
                return item.value
              }
              else {
                throwError()
              }
            }
          ),
          values,
        }
      }
      // :
      else if (charCode === char.CODE_COLON) {
        current = values
        index++
      }
      // ,
      else if (charCode === char.CODE_COMMA) {
        current = keys
        index++
      }
      else {
        array.push(
          current,
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
      index += match[ env.RAW_LENGTH ]
      return match
    }

  }

  let parseVariable = function (prevStart, prevNode) {

    let start = index, node = parseIdentifier(env.TRUE), temp

    if (prevNode) {
      node = new MemberNode(
        cutString(prevStart),
        prevNode,
        new LiteralNode(
          node.raw,
          node.name
        )
      )
    }

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
            temp.raw,
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

  let parseNumber = function (start) {
    skipNumber()
    let temp = cutString(start)
    return new LiteralNode(
      temp,
      parseFloat(temp)
    )
  }

  let parsePath = function (start, prevNode) {

    // 跳过第一个点号
    index++
    charCode = getCharCode()

    let node

    // ./
    if (charCode === char.CODE_SLASH) {
      index++
      node = new IdentifierNode(env.KEYPATH_PUBLIC_CURRENT, env.KEYPATH_PUBLIC_CURRENT)
    }
    // ../
    else if (charCode === char.CODE_DOT) {
      index++
      if (getCharCode() === char.CODE_SLASH) {
        index++
        node = new IdentifierNode(env.KEYPATH_PUBLIC_PARENT, env.KEYPATH_PUBLIC_PARENT)
      }
    }

    if (node) {
      if (prevNode) {
        node = new MemberNode(
          cutString(start),
          prevNode,
          new LiteralNode(
            node.raw,
            node.name
          )
        )
      }
      charCode = getCharCode()
      if (charCode === char.CODE_DOT) {
        return parsePath(start, node)
      }
      else if (isIdentifierStart(charCode)) {
        return parseVariable(start, node)
      }
    }

    throwError()

  }

  let parseToken = function () {

    skipWhitespace()

    charCode = getCharCode()

    let start = index, temp

    // 'xx' 或 "xx"
    if (charCode === char.CODE_SQUOTE || charCode === char.CODE_DQUOTE) {
      // 截出的字符串包含引号
      skipString()
      temp = string.slice(cutString(start), 1, -1)
      return new LiteralNode(temp, temp)
    }
    // 1.1
    else if (isDigit(charCode)) {
      return parseNumber(start)
    }
    // .1  ./  ../
    else if (charCode === char.CODE_DOT) {
      return isDigit(getNextCharCode())
        ? parseNumber(start)
        : parsePath(start)
    }
    // [xx, xx]
    else if (charCode === char.CODE_OBRACK) {
      temp = parseTuple(char.CODE_CBRACK)
      return new ArrayNode(
        cutString(start),
        temp
      )
    }
    else if (charCode === char.CODE_OBRACE) {
      temp = parseObject()
      return new ObjectNode(
        cutString(start),
        temp.keys,
        temp.values
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

    let stack = [ index, parseToken(), index ], next, length

    // stack 的结构必须是 token 之后跟一个 index
    // 这样在裁剪原始字符串时，才有据可查

    // 处理优先级，确保循环结束时，是相同的优先级操作
    while (next = parseOperator(operator.binaryList)) {

      length = stack[ env.RAW_LENGTH ]

      if (length > 7 && operator.binaryMap[ next ] < stack[ length - 4 ]) {
        stack.splice(
          length - 7,
          6,
          new BinaryNode(
            cutString(stack[ length - 8 ], stack[ length - 1 ]),
            stack[ length - 7 ],
            stack[ length - 5 ],
            stack[ length - 2 ]
          )
        )
      }

      array.push(stack, next)
      array.push(stack, operator.binaryMap[ next ])
      array.push(stack, index)
      array.push(stack, parseToken())
      array.push(stack, index)

    }

    while (env.TRUE) {
      length = stack[ env.RAW_LENGTH ]
      if (length > 8 && stack[ length - 4 ] > stack[ length - 9 ]) {
        stack.splice(
          length - 7,
          6,
          new BinaryNode(
            cutString(stack[ length - 8 ], stack[ length - 1 ]),
            stack[ length - 7 ],
            stack[ length - 5 ],
            stack[ length - 2 ]
          )
        )
      }
      else if (length > 7) {
        stack.splice(
          1,
          6,
          new BinaryNode(
            cutString(stack[ 0 ], stack[ 7 ]),
            stack[ 1 ],
            stack[ 3 ],
            stack[ 6 ]
          )
        )
      }
      else {
        return stack[ 1 ]
      }
    }

  }

  let parseExpression = function (delimiter) {

    // 主要是区分三元和二元表达式
    // 三元表达式可以认为是 3 个二元表达式组成的
    // test ? yes : no

    // 跳过开始字符
    if (delimiter) {
      index++
    }

    // 保证调用 parseExpression() 之后无需再次调用 skipWhitespace()
    let start = index, test = parseBinary()
    skipWhitespace()

    if (getCharCode() === char.CODE_QUMARK) {
      index++

      let yes = parseBinary()
      skipWhitespace()

      if (getCharCode() === char.CODE_COLON) {
        index++

        let no = parseBinary()
        skipWhitespace()

        return new TernaryNode(
          cutString(start),
          test,
          yes,
          no
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






const executor = { }

executor[ nodeType.LITERAL ] = function (node) {
  return node.value
}

executor[ nodeType.IDENTIFIER ] = function (node, getter) {
  return getter(node.name, node)
}

executor[ nodeType.MEMBER ] = function (node, getter, context) {
  let keypath = node.staticKeypath
  if (!keypath) {
    keypath = char.CHAR_BLANK
    array.each(
      node.props,
      function (node, index) {
        let { type } = node, next = char.CHAR_BLANK
        if (type !== nodeType.LITERAL) {
          if (index > 0) {
            next = execute(node, getter, context)
          }
          else if (type === nodeType.IDENTIFIER) {
            next = node.name
          }
        }
        else {
          next = node.value
        }
        keypath = keypathUtil.join(keypath, next)
      }
    )
  }
  return getter(keypath, node)
}

executor[ nodeType.UNARY ] = function (node, getter, context) {
  return interpreter.unary[ node.operator ](
    execute(node.arg, getter, context)
  )
}

executor[ nodeType.BINARY ] = function (node, getter, context) {
  return interpreter.binary[ node.operator ](
    execute(node.left, getter, context),
    execute(node.right, getter, context)
  )
}

executor[ nodeType.TERNARY ] = function (node, getter, context) {
  return execute(node.test, getter, context)
    ? execute(node.yes, getter, context)
    : execute(node.no, getter, context)
}

executor[ nodeType.ARRAY ] = function (node, getter, context) {
  return node.elements.map(
    function (node) {
      return execute(node, getter, context)
    }
  )
}

executor[ nodeType.OBJECT ] = function (node, getter, context) {
  let result = { }
  array.each(
    node.keys,
    function (key, index) {
      result[ key ] = execute(node.values[ index ], getter, context)
    }
  )
  return result
}

executor[ nodeType.CALL ] = function (node, getter, context) {
  let { args } = node
  if (args) {
    args = args.map(
      function (node) {
        return execute(node, getter, context)
      }
    )
  }
  return executeFunction(
    execute(node.callee, getter, context),
    context,
    args
  )
}

/**
 * 表达式求值
 *
 * @param {Node} node 表达式抽象节点
 * @param {Function} getter 读取数据的方法
 * @param {*} context 表达式函数调用的执行上下文
 * @return {*}
 */
export function execute(node, getter, context) {
  return executor[ node.type ](node, getter, context)
}
