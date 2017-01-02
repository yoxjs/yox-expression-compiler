
import * as env from 'yox-common/util/env'

import * as util from './util'

export const PLUS = '+'
export const MINUS = '-'
export const MULTIPLY = '*'
export const DIVIDE = '/'
export const MODULO = '%'
export const WAVE = '~'

export const AND = '&&'
export const OR = '||'
export const NOT = '!'
export const BOOLEAN = '!!'

export const SE = '==='
export const SNE = '!=='
export const LE = '=='
export const LNE = '!='
export const LT = '<'
export const LTE = '<='
export const GT = '>'
export const GTE = '>='

// 一元操作符
export const unaryMap = { }

unaryMap[ PLUS ] =
unaryMap[ MINUS ] =
unaryMap[ NOT ] =
unaryMap[ WAVE ] =
unaryMap[ BOOLEAN ] = env.TRUE

export const unaryList = util.sortKeys(unaryMap)


// 二元操作符
// 操作符和对应的优先级，数字越大优先级越高
export const binaryMap = { }

binaryMap[ OR ] = 1

binaryMap[ AND ] = 2

binaryMap[ LE ] =
binaryMap[ LNE ] =
binaryMap[ SE ] =
binaryMap[ SNE ] = 3

binaryMap[ LT ] =
binaryMap[ LTE ] =
binaryMap[ GT ] =
binaryMap[ GTE ] = 4

binaryMap[ PLUS ] =
binaryMap[ MINUS ] = 5

binaryMap[ MULTIPLY ] =
binaryMap[ DIVIDE ] =
binaryMap[ MODULO ] = 6

export const binaryList = util.sortKeys(binaryMap)
