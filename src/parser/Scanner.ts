import * as is from 'yox-common/util/is'
import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as array from 'yox-common/util/array'
import * as string from 'yox-common/util/string'
import * as object from 'yox-common/util/object'
import * as logger from 'yox-common/util/logger'

import toNumber from 'yox-common/function/toNumber'

import Node from '../node/Node'
import Identifier from '../node/Identifier'
import Literal from '../node/Literal'
import Call from '../node/Call';
import Member from '../node/Member';


export default class Scanner {

  index: number = -1

  length: number

  code: number = CODE_EOF

  constructor(public content: string) {
    this.length = content.length
  }

  /**
   * 向前移动一个字符
   */
  advance() {
    this.code = ++this.index >= this.length ? CODE_EOF : char.codeAt(this.content, this.index)
  }

  /**
   * 尝试解析下一个 token
   */
  scanToken() {

    // 这两个是不会变的
    const { content, length } = this

    // 这两个是会变的
    let { code, index } = this

    // 匹配第一个非空白符
    while (isWhitespace(code)) {
      if (++index < length) {
        code = char.codeAt(content, index)
      }
      else {
        code = CODE_EOF
        break
      }
    }

    this.code = code
    this.index = index

    if (code === CODE_EOF) {
      return
    }

    if (isIdentifierStart(code)) {
      return this.scanVariable(index, env.TRUE)
    }
    if (isDigit(code)) {
      return this.scanNumber(index)
    }

    switch (code) {

      case CODE_SQUOTE:
      case CODE_DQUOTE:
        return this.scanString(index, code)

      // .1  ./  ../
      case CODE_DOT:
        this.advance()
        return isDigit(this.code)
          ? this.scanNumber(index)
          : this.scanPath(index)

      // (xx)
      case CODE_OPAREN:
        return parseExpression(CODE_CPAREN)

      // { }
      case CODE_OBRACE:
        return 1

      // [x, y, z]
      case CODE_OBRACK:
        return 2
    }

  }

  /**
   * 根据某种规则裁剪一段字符串
   *
   * @param match 裁剪规则
   * @return
   */
  cutString(match: (code: number) => boolean, startIndex = this.index): string {
    this.advance()
    while (match(this.code)) {
      this.advance()
    }
    return string.slice(this.content, startIndex, this.index)
  }

  /**
   * 扫描数字
   *
   * 支持整数和小数
   *
   * @param startIndex
   * @return
   */
  scanNumber(startIndex: number): Literal | void {

    const instance = this

    // 数字有很多可能的形式，如 100、100.1、.1 等
    // 先切出第一部分，raw 可能是整型部分，也可能是 .1 的全部
    let raw = instance.cutString(isDigit, startIndex)

    // 尽可能的尝试匹配小数，如果写成 1.2.3 或 .1.2 也会匹配成功，虽然它是个错误的数字
    while (instance.code === char.CODE_DOT) {
      raw += instance.cutString(isDigit)
    }

    // 尝试转型，如果转型失败，则确定是个错误的数字
    if (is.numeric(raw)) {
      return new Literal(raw, +raw)
    }

    instance.reportError(startIndex, `Invalid number literal when parsing ${raw}`)

  }

  /**
   * 扫描字符串
   *
   * 支持反斜线转义引号
   *
   * @param startIndex
   */
  scanString(startIndex: number, endCode: number): Literal {

    const instance = this

    // 记录上一个字符，因为结束引号前不能有转义字符
    let lastCode: number

    do {
      lastCode = instance.code
      instance.advance()

      if (instance.code === endCode && lastCode !== CODE_BACKSLASH) {
        break
      }
      else if (instance.code === CODE_EOF) {
        instance.reportError(startIndex, 'Unterminated quote')
        break
      }

    }
    while (env.TRUE)

    // 不包含引号
    const raw = string.slice(instance.content, startIndex + 1, instance.index)

    // 跳过结束的引号
    instance.advance()

    return new Literal(raw, raw)

  }

  /**
   * 扫描元组，即 a, b, c 这种格式，可以是参数列表，也可以是数组
   *
   * @param startIndex
   * @param endCode 元组的结束字符编码
   */
  scanTuple(startIndex: number, endCode: number): Node[] | void {

    const instance = this, list: Node[] = []

    do {
      instance.advance()
      switch (instance.code) {

        case endCode:
          instance.advance()
          return list

        case CODE_COMMA:
          instance.advance()
          break

        case CODE_EOF:
          instance.reportError(startIndex, 'parse tuple error')
          break

        default:
          array.push(
            list,
            instance.scanToken()
          )

      }
    }
    while (instance.index < instance.length)

  }

  /**
   * 扫描路径，如 ./ 和 ../
   *
   * @param startIndex
   * @param prevNode
   */
  scanPath(startIndex: number, prevNode?: Member | Identifier) {

    // 方便压缩
    const instance = this

    // 要么是 current 要么是 parent
    let name = env.KEYPATH_PUBLIC_CURRENT

    // ../
    if (instance.code === char.CODE_DOT) {
      instance.advance()
      name = env.KEYPATH_PUBLIC_PARENT
    }

    // 如果以 / 结尾，则命中 ./ 或 ../
    if (instance.code === char.CODE_SLASH) {
      instance.advance()

      let node: Member | Identifier = new Identifier(name, name)

      if (prevNode) {
        node = new Member(
          string.slice(instance.content, startIndex, instance.index),
          prevNode,
          new Literal(node.raw, name)
        )
      }

      // 单纯是 ./ 或 ../ 没有意义
      // 后面必须跟着标识符或 ../
      if (isIdentifierStart(instance.code)) {
        return instance.scanVariable(startIndex, env.FALSE, node)
      }
      else if (instance.code === char.CODE_DOT) {
        // scanPath 要求调用前先跳过第一个 .
        instance.advance()
        return instance.scanPath(startIndex, node)
      }

    }

    instance.reportError(startIndex, 'path error')

  }

  /**
   * 扫描变量
   *
   */
  scanVariable(startIndex: number, careKeyword: boolean, prevNode?: Member | Identifier) {

    switch (this.code) {
      // a(x)
      case CODE_OPAREN:
        let args = this.scanTuple(this.index, CODE_CPAREN)
        return new Call('', node, args)

      // a.x
      case CODE_DOT:
        this.advance()
        let prop = this.scanIdentifier()

    }

    while (index < length) {
      // a(x)
      charCode = getCharCode()
      if (charCode === CODE_OPAREN) {
        temp = parseTuple(CODE_CPAREN)
        return new CallNode(
          cutString(start),
          node,
          temp
        )
      }
      // a.x
      else if (charCode === CODE_DOT) {
        index++
        temp = parseIdentifier()
        node = new MemberNode(
          cutString(start),
          node,
          new LiteralNode(
            temp.raw,
            temp[env.RAW_NAME]
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

  }

  /**
   * 扫描标识符
   *
   * @param careKeyword 是否识别关键字
   * @return
   */
  scanIdentifier(careKeyword = false): Identifier | Literal {

    const raw = this.cutString(isIdentifierPart)

    return careKeyword && object.has(keywords, raw)
      ? new Literal(raw, keywords[raw])
      : new Identifier(raw, raw)

  }





  reportError(start: number, message: string) {
    logger.error(message)
  }

}

const CODE_EOF = 0        //
const CODE_DOT = 46       // .
const CODE_COMMA = 44     // ,
const CODE_SLASH = 47     // /
const CODE_BACKSLASH = 92 // \
const CODE_SQUOTE = 39    // '
const CODE_DQUOTE = 34    // "
const CODE_OPAREN = 40    // (
const CODE_CPAREN = 41    // )
const CODE_OBRACK = 91    // [
const CODE_CBRACK = 93    // ]
const CODE_OBRACE = 123   // {
const CODE_CBRACE = 125   // }

/**
 * 区分关键字和普通变量
 * 举个例子：a === true
 * 从解析器的角度来说，a 和 true 是一样的 token
 */
const keywords = {}

keywords[env.RAW_TRUE] = env.TRUE
keywords[env.RAW_FALSE] = env.FALSE
keywords[env.RAW_NULL] = env.NULL
keywords[env.RAW_UNDEFINED] = env.UNDEFINED

/**
 * 是否是空白符，用下面的代码在浏览器测试一下
 *
 * ```
 * for (var i = 0; i < 200; i++) {
 *   console.log(i, String.fromCharCode(i))
 * }
 * ```
 *
 * 从 0 到 32 全是空白符，100 往上分布比较散且较少用，唯一需要注意的是 160
 *
 * 160 表示 non-breaking space
 * http://www.adamkoch.com/2009/07/25/white-space-and-character-160/
 */
function isWhitespace(code: number): boolean {
  return code < 33 || code === 160
}

/**
 * 是否是数字
 */
function isDigit(code: number): boolean {
  return code > 47 && code < 58 // 0...9
}

/**
 * 变量开始字符必须是 字母、下划线、$
 */
function isIdentifierStart(code: number): boolean {
  return code === 36 // $
    || code === 95   // _
    || (code > 96 && code < 123) // a...z
    || (code > 64 && code < 91)  // A...Z
}

/**
 * 变量剩余的字符必须是 字母、下划线、$、数字
 */
function isIdentifierPart(code: number): boolean {
  return isIdentifierStart(code) || isDigit(code)
}
