import Keypath from './Keypath'

export default interface Identifier extends Keypath {

  name: string

  // 当标识符出现多段，比如 a.b.c，会把它解析成数组，存入 literals
  literals?: string[]

}
