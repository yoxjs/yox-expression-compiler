import * as is from 'yox-common/util/is'
import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as array from 'yox-common/util/array'
import * as string from 'yox-common/util/string'
import * as object from 'yox-common/util/object'
import * as logger from 'yox-common/util/logger'
import * as keypathUtil from 'yox-common/util/keypath'

import toNumber from 'yox-common/function/toNumber'

import * as nodeType from '../nodeType'

import Node from '../node/Node'
import Identifier from '../node/Identifier'
import Literal from '../node/Literal'
import Call from '../node/Call';
import Member from '../node/Member';
import Variable from '../node/Variable';


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
   * 截取一段字符串
   *
   * @param startIndex
   */
  pick(startIndex: number): string {
    return string.slice(this.content, startIndex, this.index)
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
      let identifier = this.scanIdentifier(index, env.TRUE)
      return this.scanVariable(this.index, [identifier])
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
    return this.pick(startIndex)
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

    while (env.TRUE) {
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

    // 不包含引号
    const raw = instance.pick(startIndex + 1)

    // 跳过结束的引号
    instance.advance()

    return new Literal(raw, raw)

  }

  /**
   * 扫描元组，即 `a, b, c` 这种格式，可以是参数列表，也可以是数组
   *
   * @param startIndex
   * @param endCode 元组的结束字符编码
   */
  scanTuple(startIndex: number, endCode: number): Node[] | never {

    const instance = this, nodes: Node[] = []

    loop:
    while (env.TRUE) {
      instance.advance()
      switch (instance.code) {

        case endCode:
          instance.advance()
          return nodes

        case CODE_COMMA:
          instance.advance()
          break

        case CODE_EOF:
          break loop

        default:
          array.push(
            nodes,
            instance.scanToken()
          )

      }
    }

    return instance.reportError(startIndex, 'parse tuple error')

  }

  /**
   * 扫描路径，如 `./` 和 `../`
   *
   * 路径必须位于开头，如 ./../ 或 ../../，不存在 a/../b/../c 这样的情况，因为路径是用来切换或指定 context 的
   *
   * @param startIndex
   * @param prevNode
   */
  scanPath(startIndex: number): Variable | never {

    // 方便压缩
    const instance = this

    // 进入此函数时，已确定前一个 code 是 CODE_DOT
    // 此时只需判断接下来是 ./ 还是 / 就行了

    let name: string, nodes: Variable[] = [], error = char.CHAR_BLANK

    while (env.TRUE) {
      // 要么是 current 要么是 parent
      name = env.KEYPATH_PUBLIC_CURRENT

      // ../
      if (instance.code === CODE_DOT) {
        instance.advance()
        name = env.KEYPATH_PUBLIC_PARENT
      }

      array.push(
        nodes,
        createIdentifier(name, name)
      )

      // 如果以 / 结尾，则命中 ./ 或 ../
      if (instance.code === CODE_SLASH) {
        instance.advance()

        // 可能有人会怀疑，此处出现 ../1 这样的情况
        // 层级对象有数字属性是什么情况，不用考虑代码维护性吗?
        // 拒绝支持这种变态需求，谢谢
        if (isIdentifierStart(instance.code)) {
          array.push(
            nodes,
            instance.scanIdentifier(instance.index)
          )
          return instance.scanVariable(startIndex, nodes)
        }
        else if (instance.code === char.CODE_DOT) {
          // 先跳过第一个 .
          instance.advance()
          // 继续循环
        }
        else {
          // 类似 ./ 或 ../ 这样后面不跟标识符是想干嘛？报错可好？
          error = 'path error'
          break
        }

      }
      // 类似 . 或 ..，可能就是想读取层级对象
      // 此处不用关心后面跟的具体是什么字符，那是其他函数的事情，就算报错也让别的函数去报
      // 此处也不用关心延展操作符，即 ...object，因为表达式引擎管不了这事，它没法把对象变成 attr1=value1 attr2=value2 的格式
      // 这应该是模板引擎该做的事
      else {
        break
      }
    }

    if (error) {
      return instance.reportError(startIndex, error)
    }

  }

  /**
   * 扫描变量
   *
   */
  scanVariable(startIndex: number, nodes: Node[]) {

    const instance = this

    // 标识符后面紧着的字符，可以是 ( . [
    switch (instance.code) {

      // a(x)
      case CODE_OPAREN:
        let args = instance.scanTuple(instance.index, CODE_CPAREN)
        return new Call(
          string.slice(instance.content, startIndex, instance.index),
          node,
          args
        )

      // a.x
      case CODE_DOT:
        instance.advance()
        // 接下来的字符，可能是数字，也可能是标识符，此时无需识别关键字
        let { raw } = instance.scanIdentifier(instance.index)
        // 如果是数字，则存储为数字，避免运行时转型
        array.push(
          nodes,
          new Literal(raw, is.numeric(raw) ? +raw : raw)
        )
        break

      // a[]
      case CODE_OBRACK:
        let prop1 = parseExpression(CODE_CBRACK)
        array.push(
          nodes,
          prop1
        )
        break

      default:
        break
    }

    return node

  }

  /**
   * 扫描标识符
   *
   * @param startIndex
   * @param careKeyword 是否识别关键字
   * @return
   */
  scanIdentifier(startIndex: number, careKeyword = false): Identifier | Literal {

    const raw = this.cutString(isIdentifierPart, startIndex)

    return careKeyword && object.has(keywordLiterals, raw)
      ? new Literal(raw, keywordLiterals[raw])
      : createIdentifier(raw, raw)

  }

  reportError(start: number, message: string): never {
    return logger.fatal(message)
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
const keywordLiterals = {}

keywordLiterals[env.RAW_TRUE] = env.TRUE
keywordLiterals[env.RAW_FALSE] = env.FALSE
keywordLiterals[env.RAW_NULL] = env.NULL
keywordLiterals[env.RAW_UNDEFINED] = env.UNDEFINED

/**
 * 对外和对内的路径表示法不同
 */
const keypathNames = {}

keypathNames[env.KEYPATH_PUBLIC_CURRENT] = env.KEYPATH_PRIVATE_CURRENT
keypathNames[env.KEYPATH_PUBLIC_PARENT] = env.KEYPATH_PRIVATE_PARENT

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

/**
 * 把创建 Identifier 的转换逻辑从构造函数里抽出来，保持数据类的纯粹性
 *
 * @param raw
 * @param name
 */
function createIdentifier(raw: string, name: string): Identifier {

  let lookup = env.TRUE

  // public -> private
  if (object.has(keypathNames, name)) {
    name = keypathNames[name]
    lookup = env.FALSE
  }

  return new Identifier(raw, lookup, name)

}

/**
 * 把创建 Member 的转换逻辑从构造函数里抽出来，保持数据类的纯粹性
 *
 * @param raw
 * @param object
 * @param prop
 */
function createMember(raw: string, object: Variable, prop: Variable | Literal) {

  let props: Identifier[] = []

  array.push(
    props,
    object.type === nodeType.MEMBER
      ? (<Member>object).props
      : object
  )

  array.push(props, prop)

  let staticKeypath: string | void = env.UNDEFINED

  if (is.string(object.staticKeypath)
    && prop.type === nodeType.LITERAL
  ) {
    staticKeypath = keypathUtil.join(<string>object.staticKeypath, (<Literal>prop).value)
  }

  return new Member(raw, props[0].lookup, staticKeypath, props)

}

function createMemberIfNeeded(raw: string, nodes: Node[]) {
  return nodes.length > 1
    ? new Member(raw, nodes[0].lookup, '', nodes)
    : nodes[0]
}