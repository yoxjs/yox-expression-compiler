
import * as env from 'yox-common/util/env'

import * as util from './util'

import Unary from './node/Unary'
import Binary from './node/Binary'

// 一元操作符
export const unaryMap = { }

unaryMap[ Unary.PLUS ] =
unaryMap[ Unary.MINUS ] =
unaryMap[ Unary.BANG ] =
unaryMap[ Unary.WAVE ] =
unaryMap[ Unary.DOUBLE_BANG ] = env.TRUE

export const unaryList = util.sortKeys(unaryMap)


// 二元操作符
// 操作符和对应的优先级，数字越大优先级越高
export const binaryMap = { }

binaryMap[ Binary.OR ] = 1

binaryMap[ Binary.AND ] = 2

binaryMap[ Binary.LE ] =
binaryMap[ Binary.LNE ] =
binaryMap[ Binary.SE ] =
binaryMap[ Binary.SNE ] = 3

binaryMap[ Binary.LT ] =
binaryMap[ Binary.LTE ] =
binaryMap[ Binary.GT ] =
binaryMap[ Binary.GTE ] = 4

binaryMap[ Binary.PLUS ] =
binaryMap[ Binary.MINUS ] = 5

binaryMap[ Binary.MULTIPLY ] =
binaryMap[ Binary.DIVIDE ] =
binaryMap[ Binary.MODULO ] = 6

export const binaryList = util.sortKeys(binaryMap)
