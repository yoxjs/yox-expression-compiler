export const unary = {
  '+': { exec(a: any) { return +a } },
  '-': { exec(a: any) { return -a } },
  '~': { exec(a: any) { return ~a } },
  '!': { exec(a: any) { return !a } },
  '!!': { exec(a: any) { return !!a } },
}

// 参考 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
export const binary = {
  '*': { prec: 14, exec(a: any, b: any) { return a * b } },
  '/': { prec: 14, exec(a: any, b: any) { return a / b } },
  '%': { prec: 14, exec(a: any, b: any) { return a % b } },
  '+': { prec: 13, exec(a: any, b: any) { return a + b } },
  '-': { prec: 13, exec(a: any, b: any) { return a - b } },
  '<<': { prec: 12, exec(a: any, b: any) { return a << b } },
  '>>': { prec: 12, exec(a: any, b: any) { return a >> b } },
  '>>>': { prec: 12, exec(a: any, b: any) { return a >>> b } },
  '<': { prec: 11, exec(a: any, b: any) { return a < b } },
  '<=': { prec: 11, exec(a: any, b: any) { return a <= b } },
  '>': { prec: 11, exec(a: any, b: any) { return a > b } },
  '>=': { prec: 11, exec(a: any, b: any) { return a >= b } },
  '==': { prec: 10, exec(a: any, b: any) { return a == b } },
  '!=': { prec: 10, exec(a: any, b: any) { return a != b } },
  '===': { prec: 10, exec(a: any, b: any) { return a === b } },
  '!==': { prec: 10, exec(a: any, b: any) { return a !== b } },
  '&': { prec: 9, exec(a: any, b: any) { return a & b } },
  '^': { prec: 8, exec(a: any, b: any) { return a ^ b } },
  '|': { prec: 7, exec(a: any, b: any) { return a | b } },
  '&&': { prec: 6, exec(a: any, b: any) { return a && b } },
  '||': { prec: 5, exec(a: any, b: any) { return a || b } },
}
