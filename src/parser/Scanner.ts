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
import Member from '../node/Member'
import Ternary from '../node/Ternary'
import Binary from '../node/Binary'
import Unary from '../node/Unary'
import Call from '../node/Call'

import ArrayNode from '../node/Array'
import ObjectNode from '../node/Object'

export default class Scanner {

  end: number

  index: number

  code: number

  content: string

  constructor(content: string) {
    const instance = this, { length } = content
    instance.index = -1
    instance.end = length > 0 ? length - 1 : 0
    instance.code = CODE_EOF
    instance.content = content
    instance.go()
  }

  /**
   * 向前移动一个字符
   */
  go() {
    const instance = this
    if (instance.index <= instance.end) {
      instance.code = ++instance.index > instance.end
        ? CODE_EOF
        : char.codeAt(instance.content, instance.index)
    }
  }

  /**
   * 截取一段字符串
   *
   * @param startIndex
   */
  pick(startIndex: number, endIndex = this.index): string {
    return string.slice(this.content, startIndex, endIndex)
  }

  /**
   * 跳过空白符
   */
  skip() {
    while (isWhitespace(this.code)) {
      this.go()
    }
  }

  /**
   * 尝试解析下一个 token
   */
  scanToken(): Node | void {

    const instance = this, { code, index } = instance

    if (isIdentifierStart(code)) {
      return instance.scanTail(
        index,
        [
          instance.scanIdentifier(index)
        ]
      )
    }
    if (isDigit(code)) {
      return instance.scanNumber(index)
    }

    switch (code) {

      case CODE_EOF:
        return

      // 'x' "x"
      case CODE_SQUOTE:
      case CODE_DQUOTE:
        return instance.scanTail(
          index,
          [
            instance.scanString(index, code)
          ]
        )

      // .1  ./  ../
      case CODE_DOT:
        instance.go()
        return isDigit(instance.code)
          ? instance.scanNumber(index)
          : instance.scanPath(index)

      // (xx)
      case CODE_OPAREN:
        return instance.scanTernary(index, CODE_CPAREN)

      // [xx, xx]
      case CODE_OBRACK:
        return instance.scanTail(
          index,
          [
            createArray(
              instance.scanTuple(index, CODE_CBRACK),
              instance.pick(index)
            )
          ]
        )

      // { a: 'x', b: 'x' }
      case CODE_OBRACE:
        return instance.scanObject(index)

    }

    let error = '毛都没匹配到'

    // 因为 scanOperator 会导致 index 发生变化，只能放在最后尝试
    const operator = instance.scanOperator(index)
    if (operator && interpreter.unary[operator]) {
      const node = instance.scanTernary(instance.index)
      if (node) {
        return createUnary(
          operator,
          node,
          instance.pick(index)
        )
      }
      error = '一元运算的表达式没找到'
    }


    instance.fatal(index, error)

  }

  /**
   * 根据某种规则裁剪一段字符串
   *
   * @param match 裁剪规则
   * @return
   */
  cutString(match: (code: number) => boolean, startIndex = this.index): string {
    this.go()
    while (match(this.code)) {
      this.go()
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
      ? createLiteral(+raw, raw)
      : this.fatal(startIndex, `Invalid number literal when parsing ${raw}`)

  }

  /**
   * 扫描字符串
   *
   * 支持反斜线转义引号
   *
   * @param startIndex
   * @param endCode
   */
  scanString(startIndex: number, endCode: number): Literal | never {

    let instance = this, error = char.CHAR_BLANK

    loop: while (env.TRUE) {

      // 这句有两个作用：
      // 1. 跳过开始的引号
      // 2. 驱动 index 前进
      instance.go()

      switch (instance.code) {

        // \" \'
        case CODE_BACKSLASH:
          instance.go()
          break

        case endCode:
          instance.go()
          break loop

        case CODE_EOF:
          error = 'Unterminated quote'
          break loop

      }

    }

    if (error) {
      return instance.fatal(startIndex, error)
    }

    // new Function 处理字符转义
    const raw = instance.pick(startIndex)
    return createLiteral(
      new Function(`return ${raw}`)(),
      raw
    )

  }

  /**
   * 扫描对象字面量
   *
   * @param startIndex
   */
  scanObject(startIndex: number): Node | never {

    let instance = this, keys = [], values = [], scanKey = env.TRUE, error = char.CHAR_BLANK, node: Node | void

    // 跳过 {
    instance.go()

    loop: while (env.TRUE) {

      switch (instance.code) {

        case CODE_CBRACE:
          instance.go()
          if (keys.length !== values.length) {
            error = 'keys 和 values 的长度不一致'
          }
          break loop

        case CODE_EOF:
          error = 'scanObject 到头了还没解析完'
          break loop

        // :
        case CODE_COLON:
          instance.go()
          scanKey = env.FALSE
          break

        // ,
        case CODE_COMMA:
          instance.go()
          scanKey = env.TRUE
          break

        default:
          console.log(instance.index, 'going')
          // 解析 key 的时候，node 可以为空，如 { }
          // 解析 value 的时候，node 不能为空
          node = instance.scanTernary(instance.index)
          if (scanKey) {
            if (node) {
              // 处理 { key : value } key 后面的空格
              instance.skip()
              if (node.type === nodeType.IDENTIFIER) {
                array.push(keys, (node as Identifier).name)
              }
              else if (node.type === nodeType.LITERAL) {
                array.push(keys, (node as Literal).value)
              }
              else {
                error = 'object key node type is not ok'
                break loop
              }
            }
          }
          else if (node) {
            // 处理 { key : value } value 后面的空格
            instance.skip()
            array.push(values, node)
          }
          else {
            error = 'object value is not found'
            break loop
          }
      }
    }

    return error
      ? instance.fatal(startIndex, error)
      : createObject(keys, values, instance.pick(startIndex))

  }

  /**
   * 扫描元组，即 `a, b, c` 这种格式，可以是参数列表，也可以是数组
   *
   * @param startIndex
   * @param endCode 元组的结束字符编码
   */
  scanTuple(startIndex: number, endCode: number): Node[] | never {

    let instance = this, nodes: Node[] = [], error = char.CHAR_BLANK, node: Node | void

    // 跳过开始字符，如 [ 和 (
    instance.go()

    loop: while (env.TRUE) {
      switch (instance.code) {

        case endCode:
          instance.go()
          break loop

        case CODE_EOF:
          error = 'parse tuple 到头了还没解析完？'
          break loop

        case CODE_COMMA:
          instance.go()
          break

        default:
          // 1. ( )
          // 2. (1, 2, )
          // 这三个例子都会出现 scanTernary 为空的情况
          // 但是不用报错
          node = instance.scanTernary(instance.index)
          if (node) {
            // 为了解决 1 , 2 , 3 这样的写法
            // 当解析出值后，先跳过后面的空格
            instance.skip()
            array.push(nodes, node)
          }
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

    let instance = this, nodes: Node[] = [], error = char.CHAR_BLANK, name: string | void

    // 进入此函数时，已确定前一个 code 是 CODE_DOT
    // 此时只需判断接下来是 ./ 还是 / 就行了

    while (env.TRUE) {

      // 要么是 current 要么是 parent
      name = env.KEYPATH_PUBLIC_CURRENT

      // ../
      if (instance.code === CODE_DOT) {
        instance.go()
        name = env.KEYPATH_PUBLIC_PARENT
      }

      array.push(
        nodes,
        createIdentifier(name, name, nodes[env.RAW_LENGTH] > 0)
      )

      // 如果以 / 结尾，则命中 ./ 或 ../
      if (instance.code === CODE_SLASH) {
        instance.go()

        // 没写错，这里不必强调 isIdentifierStart，数字开头也可以吧
        if (isIdentifierPart(instance.code)) {
          array.push(
            nodes,
            instance.scanIdentifier(instance.index, env.TRUE)
          )
          return instance.scanTail(startIndex, nodes)
        }
        else if (instance.code === CODE_DOT) {
          // 先跳过第一个 .
          instance.go()
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
  scanTail(startIndex: number, nodes: Node[]): Node | never {

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
            createCall(node, args, instance.pick(startIndex))
          )
          break

        // a.x
        case CODE_DOT:
          instance.go()

          // 接下来的字符，可能是数字，也可能是标识符，如果不是就报错
          if (isIdentifierPart(instance.code)) {
            // 无需识别关键字
            array.push(
              nodes,
              instance.scanIdentifier(instance.index, env.TRUE)
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

        default:
          break loop

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
   * @param isProp 是否是对象的属性
   * @return
   */
  scanIdentifier(startIndex: number, isProp = env.FALSE): Identifier | Literal {

    const raw = this.cutString(isIdentifierPart, startIndex)

    return !isProp && object.has(keywordLiterals, raw)
      ? createLiteral(keywordLiterals[raw], raw)
      : createIdentifier(raw, raw, isProp)

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
        instance.go()
        break;

      // *、**
      case CODE_MULTIPLY:
        instance.go()
        if (instance.code === CODE_MULTIPLY) {
          instance.go()
        }
        break

      // -、->
      case CODE_MINUS:
        instance.go()
        if (instance.code === CODE_GREAT) {
          instance.go()
        }
        break

      // !、!!、!=、!==
      case CODE_NOT:
        instance.go()
        if (instance.code === CODE_NOT) {
          instance.go()
        }
        else if (instance.code === CODE_EQUAL) {
          instance.go()
          if (instance.code === CODE_EQUAL) {
            instance.go()
          }
        }
        break

      // &、&&
      case CODE_AND:
        instance.go()
        if (instance.code === CODE_AND) {
          instance.go()
        }
        break

      // |、||
      case CODE_OR:
        instance.go()
        if (instance.code === CODE_OR) {
          instance.go()
        }
        break

      // ==、===、=>
      case CODE_EQUAL:
        instance.go()
        if (instance.code === CODE_EQUAL) {
          instance.go()
          if (instance.code === CODE_EQUAL) {
            instance.go()
          }
        }
        else if (instance.code === CODE_GREAT) {
          instance.go()
        }
        else {
          // 一个等号要报错
          instance.fatal(startIndex, '不支持赋值')
        }
        break

      // <、<=、<<
      case CODE_LESS:
        instance.go()
        if (instance.code === CODE_EQUAL
          || instance.code === CODE_LESS
        ) {
          instance.go()
        }
        break

      // >、>=、>>、>>>
      case CODE_GREAT:
        instance.go()
        if (instance.code === CODE_EQUAL) {
          instance.go()
        }
        else if (instance.code === CODE_GREAT) {
          instance.go()
          if (instance.code === CODE_GREAT) {
            instance.go()
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
  scanBinary(startIndex: number): Node | void {

    // 二元运算，如 a + b * c / d，这里涉及运算符的优先级
    // 算法参考 https://en.wikipedia.org/wiki/Shunting-yard_algorithm
    let instance = this,

    // 格式为 [ index1, node1, index2, node2, ... ]
    output: any[] = [],

    token: Node | void,

    operator: string | void,

    operatorInfo: any | void,

    lastOperator: string | void,

    lastOperatorIndex: number | void,

    lastOperatorInfo: any | void

    while (env.TRUE) {

      instance.skip()

      array.push(output, instance.index)
      token = instance.scanToken()

      if (token) {

        array.push(output, token)
        array.push(output, instance.index)

        instance.skip()

        operator = instance.scanOperator(instance.index)

        // 必须是二元运算符，一元不行
        if (operator && (operatorInfo = interpreter.binary[operator])) {

          // 比较前一个运算符
          lastOperatorIndex = output.length - 4

          // 如果前一个运算符的优先级 >= 现在这个，则新建 Binary
          // 如 a + b * c / d，当从左到右读取到 / 时，发现和前一个 * 优先级相同，则把 b * c 取出用于创建 Binary
          if ((lastOperator = output[lastOperatorIndex])
            && (lastOperatorInfo = interpreter.binary[lastOperator])
            && lastOperatorInfo.prec >= operatorInfo.prec
          ) {
            output.splice(
              lastOperatorIndex - 3, 6,
              createBinary(
                output[lastOperatorIndex - 2],
                lastOperator,
                output[lastOperatorIndex + 3],
                instance.pick(output[lastOperatorIndex - 3], output[lastOperatorIndex + 2])
              )
            )
          }

          array.push(output, operator)

          continue

        }

      }

      // 没匹配到 token 或 operator 则跳出循环
      break

    }

    // 类似 a + b * c 这种走到这会有 11 个
    // 此时需要从后往前遍历，因为确定后面的优先级肯定大于前面的
    while (env.TRUE) {
      console.log(output)
      // 最少的情况是 a + b，它有 7 个元素
      if (output.length >= 7) {
        lastOperatorIndex = output.length - 4
        console.log(lastOperatorIndex)
        output.splice(
          lastOperatorIndex - 2, 5,
          createBinary(
            output[lastOperatorIndex - 2],
            output[lastOperatorIndex],
            output[lastOperatorIndex + 2],
            instance.pick(output[lastOperatorIndex - 3], output[lastOperatorIndex + 3])
          )
        )
      }
      else {
        return output[1]
      }
    }

  }

  /**
   * 扫描三元运算
   *
   * @param startIndex
   * @param endCode
   */
  scanTernary(startIndex: number, endCode?: number): Node | void {

    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
     *
     * ?: 运算符的优先级几乎是最低的，比它低的只有四种： 赋值、yield、延展、逗号
     * 我们不支持这四种，因此可认为 ?: 优先级最低
     */

    const instance = this

    if (endCode) {
      instance.go()
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
        test = createTernary(
          test, yes, no,
          instance.pick(startIndex)
        )
      }
      else {
        instance.fatal(startIndex, 'are you kiding me?')
      }
    }

    // 过掉结束字符
    if (endCode) {
      instance.skip()
      if (instance.code === endCode) {
        instance.go()
      }
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


function createArray(elements: Node[], raw: string): ArrayNode {
  return {
    type: nodeType.ARRAY,
    raw,
    elements,
  }
}

function createObject(keys: string[], values: Node[], raw: string): ObjectNode {
  return {
    type: nodeType.OBJECT,
    raw,
    keys,
    values,
  }
}

function createUnary(operator: string, arg: Node, raw: string): Unary {
  return {
    type: nodeType.UNARY,
    raw,
    operator,
    arg
  }
}

function createBinary(left: Node, operator: string, right: Node, raw: string): Binary {
  return {
    type: nodeType.BINARY,
    raw,
    left,
    operator,
    right
  }
}

function createTernary(test: Node, yes: Node, no: Node, raw: string): Ternary {
  return {
    type: nodeType.TERNARY,
    raw,
    test,
    yes,
    no
  }
}

function createCall(callee: Node, args: Node[], raw: string): Call {
  return {
    type: nodeType.CALL,
    raw,
    callee,
    args,
  }
}

function createLiteral(value: any, raw: string): Literal {
  return {
    type: nodeType.LITERAL,
    raw,
    value,
  }
}

/**
 * 把创建 Identifier 的转换逻辑从构造函数里抽出来，保持数据类的纯粹性
 *
 * @param raw
 * @param name
 * @param isProp 是否是对象的属性
 */
function createIdentifier(raw: string, name: string, isProp = env.FALSE): Identifier | Literal {

  let lookup = env.TRUE

  // public -> private
  if (object.has(keypathNames, name)) {
    name = keypathNames[name]
    lookup = env.FALSE
  }

  // 对象属性需要区分 a.b 和 a[b]
  // 如果不借用 Literal 无法实现这个判断
  // 同理，如果用了这种方式，就无法区分 a.b 和 a['b']，但是无所谓，这两种表示法本就一个意思

  return isProp
    ? createLiteral(name, raw)
    : {
        type: nodeType.IDENTIFIER,
        raw,
        name,
        lookup,
        staticKeypath: name
      }

}

/**
 * 通过判断 nodes 来决定是否需要创建 Member
 *
 * 创建 Member 至少需要 nodes 有两个元素
 *
 * nodes 元素类型没有限制，可以是 Identifier、Literal、Call，或是别的完整表达式
 *
 * @param raw
 * @param nodes
 */
function createMemberIfNeeded(raw: string, nodes: Node[]): Node | Member {

  // lookup 要求第一位元素是 Identifier 或 nodeType.MEMBER，且它的 lookup 是 true，才为 true
  // 其他情况都为 false，如 "11".length 第一位元素是 Literal，不存在向上寻找的需求
  let firstNode = nodes[0], length = nodes[env.RAW_LENGTH], lookup = env.FALSE, staticKeypath: string | void

  if (firstNode.type === nodeType.IDENTIFIER
    || firstNode.type === nodeType.MEMBER
  ) {
    lookup = (firstNode as Identifier).lookup
    staticKeypath = (firstNode as Identifier).staticKeypath
  }

  // 算出 staticKeypath 的唯一方式是，第一位元素是 Identifier，后面都是 Literal
  // 否则就表示中间包含动态元素，这会导致无法计算静态路径
  // 如 a.b.c 可以算出 staticKeypath，而 a[b].c 则不行，因为 b 是动态的
  if (is.string(staticKeypath)) {
    for (let i = 1, value: any; i < length; i++) {
      if (nodes[i].type === nodeType.LITERAL) {
        value = (nodes[i] as Literal).value
        if (is.string(value) || is.number(value)) {
          staticKeypath = keypathUtil.join(staticKeypath as string, value)
          continue
        }
      }
      staticKeypath = env.UNDEFINED
      break
    }
  }

  return length > 1
    ? {
        type: nodeType.MEMBER,
        raw,
        lookup,
        staticKeypath,
        props: object.copy(nodes)
      }
    : firstNode
}
