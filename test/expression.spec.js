
import compile from '../compile'
import execute from '../execute'

import * as object from 'yox-common/util/object'

describe('expression', () => {
  it('demo1', () => {

    let ast = compile('a.b["u" + "ser"].d')

    let data = {
      a: {
        b: {
          user: {
            d: 2,
          }
        }
      },
      c: 'user'
    }

    let result = execute(
      ast,
      {
        get: function (keypath) {
          return {
            value: object.get(data, keypath).value,
            keypath: keypath,
          }
        }
      },
      function (key, value) {

      }
    )

    expect(result).toBe(2)

  })

})
