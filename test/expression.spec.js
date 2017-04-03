
import * as expression from '../src/index'

describe('expression', () => {
  it('demo1', () => {

    let ast = expression.compile('a + b')
    expect(expression.stringify(ast)).toBe('a + b')

    let data = {
      a: 1,
      b: 1,
    }

    let result = expression.execute(
      ast,
      {
        get: function (keypath) {
          return {
            value: data[keypath],
            keypath: keypath,
          }
        }
      }
    )

    expect(result.value).toBe(2)

  })

})
