import * as is from 'yox-common/util/is'
import * as env from 'yox-common/util/env'
import * as char from 'yox-common/util/char'
import * as array from 'yox-common/util/array'
import * as string from 'yox-common/util/string'
import * as object from 'yox-common/util/object'
import * as logger from 'yox-common/util/logger'
import * as keypathUtil from 'yox-common/util/keypath'


import * as nodeType from '../nodeType'
import * as interpreter from '../interpreter'

import Node from '../node/Node'
import Identifier from '../node/Identifier'
import Literal from '../node/Literal'
import Call from '../node/Call'
import Member from '../node/Member'
import Variable from '../node/Variable'
import Ternary from '../node/Ternary';
import Binary from '../node/Binary';
import Unary from '../node/Unary';

import ArrayNode from '../node/Array';
import ObjectNode from '../node/Object';

export default class Scanner {

  index: number = -1

  length: number

  code: number = CODE_EOF

  constructor(public content: string) {
    this.length = content.length
    this.advance()
  }

  /**
   * 向前移动一个字符
   */
  advance() {
    const instance = this
    if (instance.index < instance.length) {
      instance.code = ++instance.index >= instance.length ? CODE_EOF : char.codeAt(instance.content, instance.index)
    }
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
   *
   * @param endCode
   */
  scanToken(endCode?: number) {

    const instance = this

    // 匹配第一个非空白符
    while (isWhitespace(instance.code)) {
      instance.advance()
    }

    let { code, index } = instance

    if (code === CODE_EOF || code === endCode) {
      return
    }

    if (isIdentifierStart(code)) {
      return instance.scanIdentifierTail(
        index,
        [instance.scanIdentifier(index, env.TRUE) ]
      )
    }
    if (isDigit(code)) {
      return instance.scanNumber(index)
    }

    const operator = instance.scanOperator(index)
    if (operator && interpreter.unary[operator]) {
      const arg = instance.scanTernary(instance.index)
      return new Unary(
        instance.pick(index),
        operator,
        arg
      )
    }

    switch (code) {

      // 'x' "x"
      case CODE_SQUOTE:
      case CODE_DQUOTE:
        instance.advance()
        return instance.scanString(index, code)

      // .1  ./  ../
      case CODE_DOT:
        instance.advance()
        return isDigit(instance.code)
          ? instance.scanNumber(index)
          : instance.scanPath(index)

      // (xx)
      case CODE_OPAREN:
        return instance.scanTernary(index, CODE_CPAREN)

      // [xx, xx]
      case CODE_OBRACK:
        const elements = instance.scanTuple(index, CODE_CBRACK)
        return new ArrayNode(instance.pick(index), elements)

      // { a: 'x', b: 'x' }
      case CODE_OBRACE:
        return instance.scanObject(index)

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
  scanNumber(startIndex: number): Literal | never {

    const raw = this.cutString(isNumber, startIndex)

    // 尝试转型，如果转型失败，则确定是个错误的数字
    return is.numeric(raw)
      ? new Literal(raw, +raw)
      : this.fatal(startIndex, `Invalid number literal when parsing ${raw}`)

  }

  /**
   * 扫描字符串
   *
   * 支持反斜线转义引号
   *
   * @param startIndex
   */
  scanString(startIndex: number, endCode: number): Literal | never {

    let instance = this, error = char.CHAR_BLANK

    loop: while (env.TRUE) {

      switch (instance.code) {

        // \" \'
        case CODE_BACKSLASH:
          instance.advance()
          break

        case endCode:
          instance.advance()
          break loop

        case CODE_EOF:
          error = 'Unterminated quote'
          break loop

      }

      instance.advance()

    }

    if (error) {
      return instance.fatal(startIndex, error)
    }

    // new Function 处理字符转义
    const raw = instance.pick(startIndex)
    return new Literal(raw, new Function(`return ${raw}`)())

  }

  /**
   * 扫描对象字面量
   *
   * @param startIndex
   */
  scanObject(startIndex: number): Node | never {

    let instance = this, keys = [], values = [], scanKey = env.TRUE, error = char.CHAR_BLANK, node: Node | void

    // 跳过 {
    instance.advance()

    loop: while (env.TRUE) {

      switch (instance.code) {

        case CODE_CBRACE:
          instance.advance()
          if (keys.length !== values.length) {
            error = 'parse object error'
          }
          break loop

        case CODE_EOF:
          error = 'parse object error'
          break loop

        // :
        case CODE_COLON:
          instance.advance()
          scanKey = env.FALSE
          break

        // ,
        case CODE_COMMA:
          instance.advance()
          scanKey = env.TRUE
          break

        default:
          node = instance.scanTernary(instance.index)
          if (scanKey) {
            if (node.type === nodeType.IDENTIFIER) {
              array.push(keys, (node as Identifier).name)
            }
            else if (node.type === nodeType.LITERAL) {
              array.push(keys, (node as Literal).value)
            }
            else {
              error = 'key is not ok'
              break loop
            }
          }
          else {
            array.push(values, node)
          }
      }
    }

    return error
      ? instance.fatal(startIndex, error)
      : new ObjectNode(
          instance.pick(startIndex),
          keys,
          values
        )

  }

  /**
   * 扫描元组，即 `a, b, c` 这种格式，可以是参数列表，也可以是数组
   *
   * @param startIndex
   * @param endCode 元组的结束字符编码
   */
  scanTuple(startIndex: number, endCode: number): Node[] | never {

    let instance = this, nodes: Node[] = [], error = char.CHAR_BLANK

    // 跳过开始字符，如 [ 和 (
    instance.advance()

    loop: while (env.TRUE) {
      switch (instance.code) {

        case endCode:
        case CODE_COMMA:
          instance.advance()
          break

        case CODE_EOF:
          error = 'parse tuple error'
          break loop

        default:
          array.push(
            nodes,
            instance.scanTernary(instance.index)
          )

      }
    }

    return error
      ? instance.fatal(startIndex, error)
      : nodes

  }

  /**
   * 扫描路径，如 `./` 和 `../`
   *
   * 路径必须位于开头，如 ./../ 或 ../../，不存在 a/../b/../c 这样的情况，因为路径是用来切换或指定 context 的
   *
   * @param startIndex
   * @param prevNode
   */
  scanPath(startIndex: number): Node | never {

    let instance = this, nodes: Variable[] = [], error = char.CHAR_BLANK, name: string | void

    // 进入此函数时，已确定前一个 code 是 CODE_DOT
    // 此时只需判断接下来是 ./ 还是 / 就行了

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

        // 没写错，这里不必强调 isIdentifierStart
        if (isIdentifierPart(instance.code)) {
          array.push(
            nodes,
            instance.scanIdentifier(instance.index)
          )
          return instance.scanIdentifierTail(startIndex, nodes)
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

    return instance.fatal(startIndex, error)

  }

  /**
   * 扫描变量
   *
   */
  scanIdentifierTail(startIndex: number, nodes: Node[]): Node | never {

    let instance = this, error = char.CHAR_BLANK, node: Node | void, raw: string | void

    /**
     * 标识符后面紧着的字符，可以是 ( . [，此外还存在各种组合，感受一下：
     *
     * a.b.c().length
     * a[b].c()()
     * a[b][c]()[d](e, f, g).length
     *
     */

    loop: while (env.TRUE) {

      switch (instance.code) {

        // a(x)
        case CODE_OPAREN:

          raw = instance.pick(startIndex)

          // 参数列表
          const args = instance.scanTuple(instance.index, CODE_CPAREN)

          // 函数名
          node = createMemberIfNeeded(raw, nodes)

          // 整理队列
          nodes.length = 0

          array.push(
            nodes,
            new Call(
              instance.pick(startIndex),
              node,
              args
            )
          )
          break

        // a.x
        case CODE_DOT:
          instance.advance()

          // 接下来的字符，可能是数字，也可能是标识符，如果不是就报错
          if (isIdentifierPart(instance.code)) {
            // 无需识别关键字
            array.push(
              nodes,
              instance.scanIdentifier(instance.index)
            )
            break
          }
          else {
            error = '. 后面跟的都是啥玩意啊'
            break loop
          }

        // a[]
        case CODE_OBRACK:

          node = instance.scanTernary(instance.index, CODE_CBRACK)
          if (node) {
            array.push(nodes, node)
            break
          }
          else {
            error = '[] 内部不能为空'
            break loop
          }

      }

    }

    return error
      ? instance.fatal(startIndex, error)
      : createMemberIfNeeded(instance.pick(startIndex), nodes)

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

  /**
   * 扫描运算符
   *
   * @param startIndex
   */
  scanOperator(startIndex: number): string | void {

    const instance = this

    switch (instance.code) {

      // +、/、%、~、^
      case CODE_PLUS:
      case CODE_DIVIDE:
      case CODE_MODULO:
      case CODE_WAVE:
      case CODE_XOR:
        instance.advance()
        break;

      // *、**
      case CODE_MULTIPLY:
        instance.advance()
        if (instance.code === CODE_MULTIPLY) {
          instance.advance()
        }
        break

      // -、->
      case CODE_MINUS:
        instance.advance()
        if (instance.code === CODE_GREAT) {
          instance.advance()
        }
        break

      // !、!!、!=、!==
      case CODE_NOT:
        instance.advance()
        if (instance.code === CODE_NOT) {
          instance.advance()
        }
        else if (instance.code === CODE_EQUAL) {
          instance.advance()
          if (instance.code === CODE_EQUAL) {
            instance.advance()
          }
        }
        break

      // &、&&
      case CODE_AND:
        instance.advance()
        if (instance.code === CODE_AND) {
          instance.advance()
        }
        break

      // |、||
      case CODE_OR:
        instance.advance()
        if (instance.code === CODE_OR) {
          instance.advance()
        }
        break

      // ==、===、=>
      case CODE_EQUAL:
        instance.advance()
        if (instance.code === CODE_EQUAL) {
          instance.advance()
          if (instance.code === CODE_EQUAL) {
            instance.advance()
          }
        }
        else if (instance.code === CODE_GREAT) {
          instance.advance()
        }
        else {
          // 一个等号要报错
          instance.fatal(startIndex, '不支持赋值')
        }
        break

      // <、<=、<<
      case CODE_LESS:
        instance.advance()
        if (instance.code === CODE_EQUAL
          || instance.code === CODE_LESS
        ) {
          instance.advance()
        }
        break

      // >、>=、>>、>>>
      case CODE_GREAT:
        instance.advance()
        if (instance.code === CODE_EQUAL) {
          instance.advance()
        }
        else if (instance.code === CODE_GREAT) {
          instance.advance()
          if (instance.code === CODE_GREAT) {
            instance.advance()
          }
        }
        break
    }

    if (instance.code > startIndex) {
      return instance.pick(startIndex)
    }

  }

  /**
   * 扫描二元运算
   *
   * @param startIndex
   */
  scanBinary(startIndex: number): Node {

    // 二元运算，如 a + b * c / d，这里涉及运算符的优先级
    // 算法参考 https://en.wikipedia.org/wiki/Shunting-yard_algorithm
    let instance = this,

    output: any[] = [],

    token: Node | void,

    operator: string | void,

    operatorInfo: any | void,

    lastOperator: string | void,

    lastOperatorIndex: number | void,

    lastOperatorInfo: any | void

    while (env.TRUE) {

      token = instance.scanToken()
      if (token) {

        array.push(output, token)

        operator = instance.scanOperator(instance.index)
        // 必须是二元运算符，一元不行
        if (operator && (operatorInfo = interpreter.binary[operator])) {

          // 比较前一个运算符
          lastOperatorIndex = output.length - 2

          // 如果前一个运算符的优先级 >= 现在这个，则新建 Binary
          // 如 a + b * c / d，当从左到右读取到 / 时，发现和前一个 * 优先级相同，则把 b * c 取出用于创建 Binary
          if ((lastOperator = output[lastOperatorIndex])
            && (lastOperatorInfo = interpreter.binary[lastOperator])
            && lastOperatorInfo.prec >= operatorInfo.prec
          ) {
            output.splice(
              lastOperatorIndex - 1, 3,
              new Binary('', output[lastOperatorIndex - 1], lastOperator, output[lastOperatorIndex + 1])
            )
          }

          array.push(output, operator)

          continue

        }

      }

      // 没匹配到 token 或 operator 则跳出循环
      break

    }

    return output.length === 3
      ? new Binary(instance.pick(startIndex), output[0], output[1], output[2])
      : output[0]

  }

  /**
   * 扫描三元运算
   *
   * @param startIndex
   * @param endCode
   */
  scanTernary(startIndex: number, endCode?: number): Node {

    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
     *
     * ?: 运算符的优先级几乎是最低的，比它低的只有四种： 赋值、yield、延展、逗号
     * 我们不支持这四种，因此可认为 ?: 优先级最低
     */

    const instance = this

    if (endCode) {
      instance.advance()
    }

    let test = instance.scanBinary(startIndex),

    yes: Node | void,

    no: Node | void

    if (instance.code === CODE_QUESTION) {
      yes = instance.scanBinary(instance.index)

      if (instance.code === CODE_COLON) {
        no = instance.scanBinary(instance.index)
      }

      if (test && yes && no) {
        test = new Ternary(
          instance.pick(startIndex),
          test, yes, no
        )
      }
      else {
        instance.fatal(startIndex, 'are you kiding me?')
      }
    }

    // 过掉结束字符
    if (endCode) {
      instance.scanToken(endCode)
    }

    return test

  }

  fatal(start: number, message: string): never {
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
const CODE_QUESTION = 63  // ?
const CODE_COLON = 58     // :

const CODE_PLUS = 43      // +
const CODE_MINUS = 45     // -
const CODE_MULTIPLY = 42  // *
const CODE_DIVIDE = 47    // /
const CODE_MODULO = 37    // %
const CODE_WAVE = 126     // ~
const CODE_AND = 38       // &
const CODE_OR = 124       // |
const CODE_XOR = 94       // ^
const CODE_NOT = 33       // !
const CODE_LESS = 60      // <
const CODE_EQUAL = 61     // =
const CODE_GREAT = 62     // >

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
  return (code > 0 && code < 33) || code === 160
}

/**
 * 是否是数字
 */
function isDigit(code: number): boolean {
  return code > 47 && code < 58 // 0...9
}

/**
 * 是否是数字
 */
function isNumber(code: number): boolean {
  return isDigit(code) || code === CODE_DOT
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

function createMemberIfNeeded(raw: string, nodes: Node[]): Node {
  let firstNode = nodes[0], lookup = env.TRUE
  if (firstNode.type === nodeType.IDENTIFIER || firstNode.type === nodeType.MEMBER) {
    lookup = firstNode.lookup
  }
  // staticKeypath, nodes 还是要区分 IDENTIFIER 和 Literal，否则无法区分 a[b] 和 a.b
  return nodes.length > 1
    ? new Member(raw, lookup, '', nodes)
    : firstNode
}