export const unary = {
  '+': { x(a: any) { return +a } },
  '-': { x(a: any) { return -a } },
  '~': { x(a: any) { return ~a } },
  '!': { x(a: any) { return !a } },
  '!!': { x(a: any) { return !!a } },
}

// 参考 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
export const binary = {
  '*': { p: 14, x(a: any, b: any) { return a * b } },
  '/': { p: 14, x(a: any, b: any) { return a / b } },
  '%': { p: 14, x(a: any, b: any) { return a % b } },
  '+': { p: 13, x(a: any, b: any) { return a + b } },
  '-': { p: 13, x(a: any, b: any) { return a - b } },
  '<<': { p: 12, x(a: any, b: any) { return a << b } },
  '>>': { p: 12, x(a: any, b: any) { return a >> b } },
  '>>>': { p: 12, x(a: any, b: any) { return a >>> b } },
  '<': { p: 11, x(a: any, b: any) { return a < b } },
  '<=': { p: 11, x(a: any, b: any) { return a <= b } },
  '>': { p: 11, x(a: any, b: any) { return a > b } },
  '>=': { p: 11, x(a: any, b: any) { return a >= b } },
  '==': { p: 10, x(a: any, b: any) { return a == b } },
  '!=': { p: 10, x(a: any, b: any) { return a != b } },
  '===': { p: 10, x(a: any, b: any) { return a === b } },
  '!==': { p: 10, x(a: any, b: any) { return a !== b } },
  '&': { p: 9, x(a: any, b: any) { return a & b } },
  '^': { p: 8, x(a: any, b: any) { return a ^ b } },
  '|': { p: 7, x(a: any, b: any) { return a | b } },
  '&&': { p: 6, x(a: any, b: any) { return a && b } },
  '||': { p: 5, x(a: any, b: any) { return a || b } },
}
