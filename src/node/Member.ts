
import Node from './Node'
import * as nodeType from '../nodeType'

import * as is from 'yox-common/util/is'
import * as array from 'yox-common/util/array'
import * as keypathUtil from 'yox-common/util/keypath'

import Identifier from './Identifier';
import Literal from './Literal';

/**
 * Member 节点
 */
export default class Member extends Node {

  props: Identifier[]

  /**
   * 是否向上寻找
   *
   * 默认开启
   */
  lookup: boolean

  /**
   * 静态路径
   */
  staticKeypath: string | undefined

  constructor(raw: string, object: Member | Identifier, prop: Member | Identifier | Literal) {

    super(nodeType.MEMBER, raw)

    let props: Identifier[] = [ ]

    array.push(
      props,
      object.type === nodeType.MEMBER
      ? (<Member>object).props
      : object
    )

    array.push(props, prop)

    this.props = props
    this.lookup = props[0].lookup

    if (is.string(object.staticKeypath)
      && prop.type === nodeType.LITERAL
    ) {
      this.staticKeypath = keypathUtil.join(<string>object.staticKeypath, (<Literal>prop).value)
    }

  }

}
