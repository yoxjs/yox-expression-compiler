
import * as env from 'yox-common/util/env'
import * as array from 'yox-common/util/array'
import * as object from 'yox-common/util/object'
import * as string from 'yox-common/util/string'

/**
 * 是否是数字
 *
 * @param {number} charCode
 * @return {boolean}
 */
export function isNumber(charCode) {
  return charCode >= 48
    && charCode <= 57 // 0...9
}

/**
 * 是否是空白符
 *
 * @param {number} charCode
 * @return {boolean}
 */
export function isWhitespace(charCode) {
  return charCode === 32  // space
    || charCode === 9     // tab
}

/**
 * 变量开始字符必须是 字母、下划线、$
 *
 * @param {number} charCode
 * @return {boolean}
 */
export function isIdentifierStart(charCode) {
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
export function isIdentifierPart(charCode) {
  return isIdentifierStart(charCode) || isNumber(charCode)
}


/**
 * 倒排对象的 key
 *
 * @param {Object} obj
 * @return {Array.<string>}
 */
export function sortKeys(obj) {
  return object.keys(obj).sort(
    function (a, b) {
      return b.length - a.length
    }
  )
}

/**
 * 用倒排 token 去匹配 content 的开始内容
 *
 * @param {string} content
 * @param {Array.<string>} sortedTokens 数组长度从大到小排序
 * @return {?string}
 */
export function matchBestToken(content, sortedTokens) {
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
