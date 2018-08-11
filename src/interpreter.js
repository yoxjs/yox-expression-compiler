
import * as env from 'yox-common/util/env'
import * as operator from './operator'

export const unary = { }

unary[ operator.PLUS ] = function (a) {
  return +a
}
unary[ operator.MINUS ] = function (a) {
  return -a
}
unary[ operator.NOT ] = function (a) {
  return !a
}
unary[ operator.WAVE ] = function (a) {
  return ~a
}
unary[ operator.BOOLEAN ] = function (a) {
  return !!a
}

export const binary = { }

binary[ operator.OR ] = function (a, b) {
  return a || b
}
binary[ operator.AND ] = function (a, b) {
  return a && b
}
binary[ operator.SE ] = function (a, b) {
  return a === b
}
binary[ operator.SNE ] = function (a, b) {
  return a !== b
}
binary[ operator.LE ] = function (a, b) {
  return a == b
}
binary[ operator.LNE ] = function (a, b) {
  return a != b
}
binary[ operator.LT ] = function (a, b) {
  return a < b
}
binary[ operator.LTE ] = function (a, b) {
  return a <= b
}
binary[ operator.GT ] = function (a, b) {
  return a > b
}
binary[ operator.GTE ] = function (a, b) {
  return a >= b
}
binary[ operator.PLUS ] = function (a, b) {
  return a + b
}
binary[ operator.MINUS ] = function (a, b) {
  return a - b
}
binary[ operator.MULTIPLY ] = function (a, b) {
  return a * b
}
binary[ operator.DIVIDE ] = function (a, b) {
  return a / b
}
binary[ operator.MODULO ] = function (a, b) {
  return a % b
}
binary[ operator.TO ] = function (a, b) {
  return a > b
    ? function (callback) {
        for (let i = a, index = 0; i >= b; i--) {
          callback(i, index++)
        }
      }
    : function (callback) {
        for (let i = a, index = 0; i <= b; i++) {
          callback(i, index++)
        }
      }
}
binary[ operator.UNTIL ] = function (a, b) {
  return a > b
    ? function (callback) {
        for (let i = a, index = 0; i > b; i--) {
          callback(i, index++)
        }
      }
    : function (callback) {
        for (let i = a, index = 0; i < b; i++) {
          callback(i, index++)
        }
      }
}
