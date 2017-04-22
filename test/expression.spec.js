
import compile from '../compile'
import execute from '../execute'

describe('expression', () => {
  it('demo1', () => {

    let ast = compile('a + b')

    let data = {
      a: 1,
      b: 1,
    }

    let result = execute(
      ast,
      {
        get: function (keypath) {
          return {
            value: data[keypath],
            keypath: keypath,
          }
        }
      },
      function (keypath) {

      },
      function (key, value) {

      }
    )

    expect(result).toBe(2)

  })

})
