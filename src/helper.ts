
import * as constant from 'yox-common/src/util/constant'

export const CODE_EOF = 0        //
export const CODE_DOT = 46       // .
export const CODE_COMMA = 44     // ,
export const CODE_SLASH = 47     // /
export const CODE_BACKSLASH = 92 // \
export const CODE_SQUOTE = 39    // '
export const CODE_DQUOTE = 34    // "
export const CODE_OPAREN = 40    // (
export const CODE_CPAREN = 41    // )
export const CODE_OBRACK = 91    // [
export const CODE_CBRACK = 93    // ]
export const CODE_OBRACE = 123   // {
export const CODE_CBRACE = 125   // }
export const CODE_QUESTION = 63  // ?
export const CODE_COLON = 58     // :
export const CODE_PLUS = 43      // +
export const CODE_MINUS = 45     // -
export const CODE_MULTIPLY = 42  // *
export const CODE_DIVIDE = 47    // /
export const CODE_MODULO = 37    // %
export const CODE_WAVE = 126     // ~
export const CODE_AND = 38       // &
export const CODE_OR = 124       // |
export const CODE_XOR = 94       // ^
export const CODE_NOT = 33       // !
export const CODE_LESS = 60      // <
export const CODE_EQUAL = 61     // =
export const CODE_GREAT = 62     // >
export const CODE_AT    = 64     // @

/**
 * 区分关键字和普通变量
 * 举个例子：a === true
 * 从解析器的角度来说，a 和 true 是一样的 token
 */
export const keywordLiterals: Record<string, any> = {}

keywordLiterals[constant.RAW_TRUE] = constant.TRUE
keywordLiterals[constant.RAW_FALSE] = constant.FALSE
keywordLiterals[constant.RAW_NULL] = constant.NULL
keywordLiterals[constant.RAW_UNDEFINED] = constant.UNDEFINED

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
export function isWhitespace(code: number) {
  return (code > 0 && code < 33) || code === 160
}

/**
 * 是否是数字
 */
export function isDigit(code: number) {
  return code > 47 && code < 58 // 0...9
}

/**
 * 是否是数字
 */
export function isNumber(code: number) {
  return isDigit(code) || code === CODE_DOT
}

/**
 * 是否是插槽变量，@name 表示引用 name 所指定的插槽
 */
export function isSlotIdentifierStart(code: number) {
  return code === CODE_AT
}

/**
 * 变量开始字符必须是 字母、下划线、$
 */
export function isIdentifierStart(code: number) {
  return code === 36 // $
  || code === 95   // _
  || (code > 96 && code < 123) // a...z
  || (code > 64 && code < 91)  // A...Z
}

/**
 * 变量剩余的字符必须是 字母、下划线、$、数字
 */
export function isIdentifierPart(code: number) {
  return isIdentifierStart(code) || isDigit(code)
}
