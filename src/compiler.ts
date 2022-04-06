import isDef from 'yox-common/src/function/isDef'

import * as is from 'yox-common/src/util/is'
import * as cache from 'yox-common/src/util/cache'
import * as array from 'yox-common/src/util/array'
import * as string from 'yox-common/src/util/string'
import * as logger from 'yox-common/src/util/logger'
import * as constant from 'yox-common/src/util/constant'

import * as helper from './helper'
import * as creator from './creator'
import * as nodeType from './nodeType'
import * as interpreter from './interpreter'

import Node from './node/Node'
import Identifier from './node/Identifier'
import Literal from './node/Literal'

class Parser {

  end: number

  code: number

  index: number

  content: string

  constructor(content: string) {
    const instance = this
    instance.index = -1
    instance.end = content.length
    instance.code = helper.CODE_EOF
    instance.content = content
    instance.go()
  }

  /**
   * 移动一个字符
   */
  go(step?: number) {

    let instance = this, { index, end } = instance

    index += step || 1

    if (index >= 0 && index < end) {
      instance.code = instance.codeAt(index)
      instance.index = index
    }
    else {
      instance.code = helper.CODE_EOF
      instance.index = index < 0 ? -1 : end
    }

  }

  /**
   * 跳过空白符
   */
  skip(step?: number) {

    const instance = this, reversed = step && step < 0

    // 如果表达式是 "   xyz   "，到达结尾后，如果希望 skip(-1) 回到最后一个非空白符
    // 必须先判断最后一个字符是空白符，否则碰到 "xyz" 这样结尾不是空白符的，其实不应该回退
    if (instance.code === helper.CODE_EOF) {
      const oldIndex = instance.index
      instance.go(step)
      // 如果跳一位之后不是空白符，还原，然后返回
      if (!helper.isWhitespace(instance.code)) {
        instance.go(oldIndex - instance.index)
        return
      }
    }
    // 逆向时，只有位置真的发生过变化才需要在停止时正向移动一位
    // 比如 (a) 如果调用 skip 前位于 )，调用 skip(-1) ，结果应该是原地不动
    // 为了解决这个问题，应该首先判断当前是不是空白符，如果不是，直接返回
    else if (!helper.isWhitespace(instance.code)) {
      return
    }

    // 如果是正向的，停在第一个非空白符左侧
    // 如果是逆向的，停在第一个非空白符右侧
    while (constant.TRUE) {
      if (helper.isWhitespace(instance.code)) {
        instance.go(step)
      }
      else {
        if (reversed) {
          instance.go()
        }
        break
      }
    }

  }



  /**
   * 判断当前字符
   */
  is(code: number) {
    return this.code === code
  }

  /**
   * 截取一段字符串
   */
  pick(startIndex: number, endIndex?: number) {
    return string.slice(this.content, startIndex, isDef(endIndex) ? endIndex : this.index)
  }

  /**
   * 读取 index 位置的 char code
   *
   * @param index
   */
  codeAt(index: number) {
    return string.codeAt(this.content, index)
  }

  /**
   * 尝试解析下一个 token
   */
  scanToken(): Node | void {

    const instance = this, { code, index } = instance

    let isSlotIdentifier = constant.FALSE
    if (helper.isSlotIdentifierStart(code)) {
      isSlotIdentifier = constant.TRUE
      instance.go()
    }

    // 因为上面可能前进了一步，因此这里用 instance.code
    if (helper.isIdentifierStart(instance.code)) {
      return instance.scanTail(
        index,
        [
          instance.scanIdentifier(index, isSlotIdentifier)
        ]
      )
    }
    // @后面是个标识符才行，否则回退
    else if (isSlotIdentifier) {
      instance.go(-1)
    }
    if (helper.isDigit(code)) {
      return instance.scanNumber(index)
    }

    switch (code) {

      case helper.CODE_EOF:
        return

      // 'x' "x"
      case helper.CODE_SQUOTE:
      case helper.CODE_DQUOTE:
        return instance.scanTail(
          index,
          [
            instance.scanString(index, code)
          ]
        )

      // .1  ./  ../
      case helper.CODE_DOT:
        instance.go()
        return helper.isDigit(instance.code)
          ? instance.scanNumber(index)
          : instance.scanPath(index)

      // ~/a
      case helper.CODE_WAVE:
        // 因为 ~ 可以是一元运算符，因此必须判断后面紧跟 / 才是路径
        if (instance.codeAt(index + 1) === helper.CODE_SLASH) {
          return instance.scanPath(index)
        }
        break

      // (xx)
      case helper.CODE_OPAREN:
        instance.go()
        return instance.scanTernary(helper.CODE_CPAREN)

      // [xx, xx]
      case helper.CODE_OBRACK:
        return instance.scanTail(
          index,
          [
            creator.createArray(
              instance.scanTuple(index, helper.CODE_CBRACK),
              instance.pick(index)
            )
          ]
        )

      // { a: 'x', b: 'x' }
      case helper.CODE_OBRACE:
        return instance.scanObject(index)

    }

    // 因为 scanOperator 会导致 index 发生变化，只能放在最后尝试
    const operator = instance.scanOperator(index)
    if (operator && interpreter.unary[operator]) {
      const node = instance.scanTernary()
      if (node) {
        if (node.type === nodeType.LITERAL) {
          const value = (node as Literal).value
          if (is.number(value)) {
            // 类似 ' -1 ' 这样的右侧有空格，需要撤回来
            instance.skip(-1)
            return creator.createLiteral(
              - value,
              instance.pick(index)
            )
          }
        }
        // 类似 ' -a ' 这样的右侧有空格，需要撤回来
        instance.skip(-1)
        return creator.createUnary(
          operator,
          node,
          instance.pick(index)
        )
      }
      if (process.env.NODE_ENV === 'development') {
        // 一元运算只有操作符没有表达式？
        instance.fatal(index, `Expression expected.`)
      }
    }

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

    while (helper.isNumber(instance.code)) {
      instance.go()
    }

    const raw = instance.pick(startIndex)

    // 尝试转型，如果转型失败，则确定是个错误的数字
    if (is.numeric(raw)) {
      return creator.createLiteral(+raw, raw)
    }

    if (process.env.NODE_ENV === 'development') {
      instance.fatal(startIndex, `Number expected.`)
    }

  }

  /**
   * 扫描字符串
   *
   * 支持反斜线转义引号
   *
   * @param startIndex
   * @param endCode
   */
  scanString(startIndex: number, endCode: number): Literal {

    const instance = this

    loop: while (constant.TRUE) {

      // 这句有两个作用：
      // 1. 跳过开始的引号
      // 2. 驱动 index 前进
      instance.go()

      switch (instance.code) {

        // \" \'
        case helper.CODE_BACKSLASH:
          instance.go()
          break

        case endCode:
          instance.go()
          break loop

        case helper.CODE_EOF:
          if (process.env.NODE_ENV === 'development') {
            // 到头了，字符串还没解析完呢？
            instance.fatal(startIndex, 'Unexpected end of text.')
          }
          break loop

      }

    }

    // new Function 处理字符转义
    const raw = instance.pick(startIndex)
    return creator.createLiteral(
      new Function(`return ${raw}`)(),
      raw
    )

  }

  /**
   * 扫描对象字面量
   *
   * @param startIndex
   */
  scanObject(startIndex: number): Node {

    let instance = this, keys: string[] = [], values: Node[] = [], isKey = constant.TRUE, node: Node | void

    // 跳过 {
    instance.go()

    loop: while (constant.TRUE) {

      switch (instance.code) {

        case helper.CODE_CBRACE:
          instance.go()
          if (process.env.NODE_ENV === 'development') {
            // 对象的 keys 和 values 的长度不一致
            if (keys.length !== values.length) {
              instance.fatal(startIndex, 'The length of keys and values must be equal.')
            }
          }
          break loop

        case helper.CODE_EOF:
          if (process.env.NODE_ENV === 'development') {
            // 到头了，对象还没解析完呢？
            instance.fatal(startIndex, 'Unexpected end of text.')
          }
          break loop

        // :
        case helper.CODE_COLON:
          instance.go()
          isKey = constant.FALSE
          break

        // ,
        case helper.CODE_COMMA:
          instance.go()
          isKey = constant.TRUE
          break

        default:
          // 解析 key 的时候，node 可以为空，如 { } 或 { name: 'xx', }
          // 解析 value 的时候，node 不能为空
          node = instance.scanTernary()
          if (isKey) {
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
                if (process.env.NODE_ENV === 'development') {
                  // 对象的 key 必须是字面量或标识符
                  instance.fatal(startIndex, 'The key of an object must be a literal or identifier.')
                }
                break loop
              }
            }
          }
          else if (node) {
            // 处理 { key : value } value 后面的空格
            instance.skip()
            array.push(values, node)
          }
          // 类似这样 { key: }
          else {
            if (process.env.NODE_ENV === 'development') {
              // 对象的值没找到
              instance.fatal(startIndex, `The value of the object was not found.`)
            }
            break loop
          }
      }
    }

    return creator.createObject(keys, values, instance.pick(startIndex))

  }

  /**
   * 扫描元组，即 `a, b, c` 这种格式，可以是参数列表，也可以是数组
   *
   * @param startIndex
   * @param endCode 元组的结束字符编码
   */
  scanTuple(startIndex: number, endCode: number): Node[] {

    let instance = this, nodes: Node[] = [], node: Node | void

    // 跳过开始字符，如 [ 和 (
    instance.go()

    loop: while (constant.TRUE) {
      switch (instance.code) {

        case endCode:
          instance.go()
          break loop

        case helper.CODE_EOF:
          if (process.env.NODE_ENV === 'development') {
            // 到头了，tuple 还没解析完呢？
            instance.fatal(startIndex, 'Unexpected end of text.')
          }
          break loop

        case helper.CODE_COMMA:
          instance.go()
          break

        default:
          // 1. ( )
          // 2. (1, 2, )
          // 这三个例子都会出现 scanTernary 为空的情况
          // 但是不用报错
          node = instance.scanTernary()
          if (node) {
            // 为了解决 1 , 2 , 3 这样的写法
            // 当解析出值后，先跳过后面的空格
            instance.skip()
            array.push(nodes, node)
          }
      }
    }

    return nodes

  }

  /**
   * 扫描路径，如 `./` 和 `../` 和 `/a`
   *
   * 路径必须位于开头，如 ./../ 或 ，不存在 a/../b/../c 这样的情况，因为路径是用来切换或指定 context 的
   *
   * @param startIndex
   * @param prevNode
   */
  scanPath(startIndex: number): Node | void {

    let instance = this, nodes: Node[] = [], name: string

    // 进入此函数时，已确定前一个 code 是 helper.CODE_DOT
    // 此时只需判断接下来是 ./ 还是 / 就行了

    while (constant.TRUE) {

      name = constant.KEYPATH_CURRENT

      // ../
      if (instance.is(helper.CODE_DOT)) {
        instance.go()
        name = constant.KEYPATH_PARENT
      }
      // ~/a
      else if (instance.is(helper.CODE_WAVE)) {
        instance.go()
        name = constant.KEYPATH_ROOT
      }

      array.push(
        nodes,
        creator.createIdentifier(name, name, nodes.length > 0)
      )

      // 如果以 / 结尾，则命中 ./ 或 ../
      if (instance.is(helper.CODE_SLASH)) {
        instance.go()

        const { index, code } = instance

        let isSlotIdentifier = constant.FALSE
        if (helper.isSlotIdentifierStart(code)) {
          isSlotIdentifier = constant.TRUE
          instance.go()
        }

        // 因为上面可能前进了一步，因此这里用 instance.code
        if (helper.isIdentifierStart(instance.code)) {
          array.push(
            nodes,
            instance.scanIdentifier(index, isSlotIdentifier, constant.TRUE)
          )
          return instance.scanTail(startIndex, nodes)
        }
        else {

          // @后面是个标识符才行，否则回退
          if (isSlotIdentifier) {
            instance.go(-1)
          }

          if (instance.is(helper.CODE_DOT)) {
            // 先跳过第一个 .
            instance.go()
            // 继续循环
          }
          else {
            // 类似 ./ 或 ../ 这样后面不跟标识符是想干嘛？报错可好？
            if (process.env.NODE_ENV === 'development') {
              instance.fatal(
                startIndex,
                `${(array.last(nodes) as Node).raw}/ must be followed by an identifier.`
              )
            }
            break
          }
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

  }

  /**
   * 扫描变量
   */
  scanTail(startIndex: number, nodes: Node[]): Node | never {

    let instance = this, node: Node | void

    /**
     * 标识符后面紧着的字符，可以是 ( . [，此外还存在各种组合，感受一下：
     *
     * a.b.c().length
     * a[b].c()()
     * a[b][c]()[d](e, f, g).length
     * [].length
     */

    loop: while (constant.TRUE) {

      switch (instance.code) {

        // a(x)
        case helper.CODE_OPAREN:
          nodes = [
            creator.createCall(
              creator.createMemberIfNeeded(instance.pick(startIndex), nodes),
              instance.scanTuple(instance.index, helper.CODE_CPAREN),
              instance.pick(startIndex)
            )
          ]
          break

        // a.x
        case helper.CODE_DOT:
          instance.go()

          // 接下来的字符，可能是数字，也可能是标识符，如果不是就报错
          if (helper.isIdentifierPart(instance.code)) {
            // 无需识别关键字
            array.push(
              nodes,
              instance.scanIdentifier(instance.index, constant.FALSE, constant.TRUE)
            )
            break
          }
          else {
            if (process.env.NODE_ENV === 'development') {
              // . 后面跟的都是啥玩意啊
              instance.fatal(startIndex, 'Identifier or number expected.')
            }
            break loop
          }

        // a[]
        case helper.CODE_OBRACK:

          // 过掉 [
          instance.go()

          node = instance.scanTernary(helper.CODE_CBRACK)

          if (node) {
            array.push(nodes, node)
            break
          }
          else {
            // [] 内部不能为空
            if (process.env.NODE_ENV === 'development') {
              instance.fatal(startIndex, `[] is not allowed.`)
            }
            break loop
          }

        default:
          break loop

      }

    }

    return creator.createMemberIfNeeded(instance.pick(startIndex), nodes)

  }

  /**
   * 扫描标识符
   *
   * @param startIndex
   * @param isProp 是否是对象的属性
   * @return
   */
  scanIdentifier(startIndex: number, isSlotIdentifier: boolean, isProp?: boolean): Identifier | Literal {

    const instance = this

    // 标识符的第一个字符在外面已经判断过，肯定符合要求
    // 因此这里先前进一步
    do {
      instance.go()
    }
    while (helper.isIdentifierPart(instance.code))

    const raw = instance.pick(startIndex)

    // 插槽变量，@ 后面必须有其他字符
    if (isSlotIdentifier && raw.length === 1) {
      instance.fatal(startIndex, 'A slot identifier must be followed by its name.')
    }

    return !isProp && raw in helper.keywordLiterals
      ? creator.createLiteral(helper.keywordLiterals[raw], raw)
      : creator.createIdentifier(raw, raw, isProp)

  }

  /**
   * 扫描运算符
   *
   * @param startIndex
   */
  scanOperator(startIndex: number): string | void {

    const instance = this

    switch (instance.code) {

      // /、%、~、^
      case helper.CODE_DIVIDE:
      case helper.CODE_MODULO:
      case helper.CODE_WAVE:
      case helper.CODE_XOR:
        instance.go()
        break;

      // *
      case helper.CODE_MULTIPLY:
        instance.go()
        break

      // +
      case helper.CODE_PLUS:
        instance.go()
        if (process.env.NODE_ENV === 'development') {
          // ++
          if (instance.is(helper.CODE_PLUS)) {
            instance.fatal(startIndex, 'The operator "++" is not supported.')
          }
        }
        break

      // -
      case helper.CODE_MINUS:
        instance.go()
        if (process.env.NODE_ENV === 'development') {
          // --
          if (instance.is(helper.CODE_MINUS)) {
            instance.fatal(startIndex, 'The operator "--" is not supported.')
          }
        }
        break

      // !、!!、!=、!==
      case helper.CODE_NOT:
        instance.go()
        if (instance.is(helper.CODE_NOT)) {
          instance.go()
        }
        else if (instance.is(helper.CODE_EQUAL)) {
          instance.go()
          if (instance.is(helper.CODE_EQUAL)) {
            instance.go()
          }
        }
        break

      // &、&&
      case helper.CODE_AND:
        instance.go()
        if (instance.is(helper.CODE_AND)) {
          instance.go()
        }
        break

      // |、||
      case helper.CODE_OR:
        instance.go()
        if (instance.is(helper.CODE_OR)) {
          instance.go()
        }
        break

      // ==、===
      case helper.CODE_EQUAL:
        instance.go()
        if (instance.is(helper.CODE_EQUAL)) {
          instance.go()
          if (instance.is(helper.CODE_EQUAL)) {
            instance.go()
          }
        }
        // 一个等号要报错
        else if (process.env.NODE_ENV === 'development') {
          instance.fatal(startIndex, 'Assignment statements are not supported.')
        }
        break

      // <、<=、<<
      case helper.CODE_LESS:
        instance.go()
        if (instance.is(helper.CODE_EQUAL)
          || instance.is(helper.CODE_LESS)
        ) {
          instance.go()
        }
        break

      // >、>=、>>、>>>
      case helper.CODE_GREAT:
        instance.go()
        if (instance.is(helper.CODE_EQUAL)) {
          instance.go()
        }
        else if (instance.is(helper.CODE_GREAT)) {
          instance.go()
          if (instance.is(helper.CODE_GREAT)) {
            instance.go()
          }
        }
        break
    }

    if (instance.index > startIndex) {
      return instance.pick(startIndex)
    }

  }

  /**
   * 扫描二元运算
   */
  scanBinary(startIndex: number): Node | void {

    // 二元运算，如 a + b * c / d，这里涉及运算符的优先级
    // 算法参考 https://en.wikipedia.org/wiki/Shunting-yard_algorithm
    let instance = this,

    // 格式为 [ index1, node1, index2, node2, ... ]
    output: any[] = [],

    token: Node | void,

    index: number | void,

    operator: string | void,

    operatorPrecedence: number | void,

    lastOperator: string | void,

    lastOperatorPrecedence: number | void

    while (constant.TRUE) {

      instance.skip()

      array.push(output, instance.index)

      token = instance.scanToken()

      if (token) {

        array.push(output, token)

        array.push(output, instance.index)

        instance.skip()

        operator = instance.scanOperator(instance.index)

        // 必须是二元运算符，一元不行
        if (operator && (operatorPrecedence = interpreter.binary[operator])) {

          // 比较前一个运算符
          index = output.length - 4

          // 如果前一个运算符的优先级 >= 现在这个，则新建 Binary
          // 如 a + b * c / d，当从左到右读取到 / 时，发现和前一个 * 优先级相同，则把 b * c 取出用于创建 Binary
          if ((lastOperator = output[index])
            && (lastOperatorPrecedence = interpreter.binary[lastOperator])
            && lastOperatorPrecedence >= operatorPrecedence
          ) {
            output.splice(
              index - 2,
              5,
              creator.createBinary(
                output[index - 2],
                lastOperator,
                output[index + 2],
                instance.pick(output[index - 3], output[index + 3])
              )
            )
          }

          array.push(output, operator)

          continue

        }
        else {
          operator = constant.UNDEFINED
        }

      }
      // 比如不支持的表达式，a++ 之类的
      else if (process.env.NODE_ENV === 'development') {
        if (operator) {
          instance.fatal(startIndex, 'Invalid syntax.')
        }
      }

      // 没匹配到 token 或 operator 则跳出循环
      break

    }

    // 类似 a + b * c 这种走到这会有 11 个
    // 此时需要从后往前遍历，因为确定后面的优先级肯定大于前面的
    while (constant.TRUE) {
      // 最少的情况是 a + b，它有 7 个元素
      if (output.length >= 7) {
        index = output.length - 4
        output.splice(
          index - 2,
          5,
          creator.createBinary(
            output[index - 2],
            output[index],
            output[index + 2],
            instance.pick(output[index - 3], output[index + 3])
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
   * @param endCode
   */
  scanTernary(endCode?: number): Node | void {

    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
     *
     * ?: 运算符的优先级几乎是最低的，比它低的只有四种： 赋值、yield、延展、逗号
     * 我们不支持这四种，因此可认为 ?: 优先级最低
     */

    const instance = this

    instance.skip()

    let index = instance.index,

    test = instance.scanBinary(index),

    yes: Node | void,

    no: Node | void

    if (instance.is(helper.CODE_QUESTION)) {
      // 跳过 ?
      instance.go()
      yes = instance.scanTernary()

      if (instance.is(helper.CODE_COLON)) {
        // 跳过 :
        instance.go()
        no = instance.scanTernary()
      }

      if (test && yes && no) {
        // 类似 ' a ? 1 : 0 ' 这样的右侧有空格，需要撤回来
        instance.skip(-1)
        test = creator.createTernary(
          test, yes, no,
          instance.pick(index)
        )
      }
      else if (process.env.NODE_ENV === 'development') {
        // 三元表达式语法错误
        instance.fatal(index, `Invalid ternary syntax.`)
      }
    }

    // 过掉结束字符
    if (isDef(endCode)) {
      instance.skip()
      if (instance.is(endCode as number)) {
        instance.go()
      }
      // 没匹配到结束字符要报错
      else if (process.env.NODE_ENV === 'development') {
        instance.fatal(
          index,
          `"${String.fromCharCode(endCode as number)}" expected, "${String.fromCharCode(instance.code)}" actually.`
        )
      }
    }

    return test

  }

  fatal(start: number, message: string) {
    if (process.env.NODE_ENV === 'development') {
      logger.fatal(`Error compiling expression\n\n${this.content}\n\nmessage: ${message}\n`)
    }
  }

}

export const compile = cache.createOneKeyCache(
  function (content: string) {
    const parser = new Parser(content)
    return parser.scanTernary(helper.CODE_EOF)
  }
)