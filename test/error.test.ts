// 不支持的表达式
import { compile } from 'yox-expression-compiler/src/compiler'

test('报错', () => {
  let hasError = false
  try {
    compile('open())')
  }
  catch (e) {
    hasError = true
  }
  expect(hasError).toBe(true)
})

test('不支持的表达式', () => {

  let hasError = false

  try {
    compile('a--')
  }
  catch (e) {
    hasError = true
  }
  expect(hasError).toBe(true)

  hasError = false

  try {
    compile('a++')
  }
  catch (e) {
    hasError = true
  }
  expect(hasError).toBe(true)

  hasError = false

  try {
    compile('--a')
  }
  catch (e) {
    hasError = true
  }
  expect(hasError).toBe(true)

  hasError = false

  try {
    compile('--a')
  }
  catch (e) {
    hasError = true
  }
  expect(hasError).toBe(true)

})
