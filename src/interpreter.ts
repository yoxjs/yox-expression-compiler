import * as operator from './operator'

export const unary = { }

unary[operator.PLUS] = function (a: any) {
  return +a
}
unary[operator.MINUS] = function (a: any) {
  return -a
}
unary[operator.NOT] = function (a: any) {
  return !a
}
unary[operator.WAVE] = function (a: any) {
  return ~a
}
unary[operator.BOOLEAN] = function (a: any) {
  return !!a
}

export const binary = { }

binary[operator.OR] = function (a: any, b: any) {
  return a || b
}
binary[operator.AND] = function (a: any, b: any) {
  return a && b
}
binary[operator.SE] = function (a: any, b: any) {
  return a === b
}
binary[operator.SNE] = function (a: any, b: any) {
  return a !== b
}
binary[operator.LE] = function (a: any, b: any) {
  return a == b
}
binary[operator.LNE] = function (a: any, b: any) {
  return a != b
}
binary[operator.LT] = function (a: any, b: any) {
  return a < b
}
binary[operator.LTE] = function (a: any, b: any) {
  return a <= b
}
binary[operator.GT] = function (a: any, b: any) {
  return a > b
}
binary[operator.GTE] = function (a: any, b: any) {
  return a >= b
}
binary[operator.PLUS] = function (a: any, b: any) {
  return a + b
}
binary[operator.MINUS] = function (a: any, b: any) {
  return a - b
}
binary[operator.MULTIPLY] = function (a: any, b: any) {
  return a * b
}
binary[operator.DIVIDE] = function (a: any, b: any) {
  return a / b
}
binary[operator.MODULO] = function (a: any, b: any) {
  return a % b
}
binary[operator.TO] = function (a: any, b: any) {
  return a > b
    ? function (callback: (index: number, counter: number) => void) {
        for (let i = a, index = 0; i >= b; i--) {
          callback(i, index++)
        }
      }
    : function (callback: (index: number, counter: number) => void) {
        for (let i = a, index = 0; i <= b; i++) {
          callback(i, index++)
        }
      }
}
binary[operator.UNTIL] = function (a: any, b: any) {
  return a > b
    ? function (callback: (index: number, counter: number) => void) {
        for (let i = a, index = 0; i > b; i--) {
          callback(i, index++)
        }
      }
    : function (callback: (index: number, counter: number) => void) {
        for (let i = a, index = 0; i < b; i++) {
          callback(i, index++)
        }
      }
}
