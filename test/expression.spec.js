
import compile from '../compile'
import execute from '../execute'

import * as object from 'yox-common/util/object'

describe('expression', () => {
  it('demo1', () => {

    let ast = compile('a.b["u" + "ser"].d + 2')

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
      function (keypath) {
        return object.get(data, keypath).value
      }
    )

    expect(result).toBe(4)

  })

})
