import * as env from 'yox-common/util/env'
import * as object from 'yox-common/util/object'

export const PLUS: string = '+'
export const MINUS: string = '-'
export const MULTIPLY: string = '*'
export const DIVIDE: string = '/'
export const MODULO: string = '%'
export const WAVE: string = '~'

export const AND: string = '&&'
export const OR: string = '||'
export const NOT: string = '!'
export const BOOLEAN: string = '!!'

export const SE: string = '==='
export const SNE: string = '!=='
export const LE: string = '=='
export const LNE: string = '!='
export const LT: string = '<'
export const LTE: string = '<='
export const GT: string = '>'
export const GTE: string = '>='

export const TO: string = '=>'
export const UNTIL: string = '->'

export const unaryMap = { }

unaryMap[ PLUS ] =
unaryMap[ MINUS ] =
unaryMap[ NOT ] =
unaryMap[ WAVE ] =
unaryMap[ BOOLEAN ] = env.TRUE

export const unaryList = object.sort(unaryMap, env.TRUE)


// 操作符和对应的优先级，数字越大优先级越高
export const binaryMap = { }

binaryMap[ TO ] =
binaryMap[ UNTIL ] = 1

binaryMap[ OR ] = 2

binaryMap[ AND ] = 3

binaryMap[ LE ] =
binaryMap[ LNE ] =
binaryMap[ SE ] =
binaryMap[ SNE ] = 4

binaryMap[ LT ] =
binaryMap[ LTE ] =
binaryMap[ GT ] =
binaryMap[ GTE ] = 5

binaryMap[ PLUS ] =
binaryMap[ MINUS ] = 6

binaryMap[ MULTIPLY ] =
binaryMap[ DIVIDE ] =
binaryMap[ MODULO ] = 7

export const binaryList = object.sort(binaryMap, env.TRUE)
