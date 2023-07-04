export enum AssociationType {
  // 互斥
  Mutex = '互斥',
  // 同级
  Sibling = '同级',
  // 上级
  Superior = '上级',
  // 下级
  Subordinate = '下级',
  // 相关
  Associate = '相关',
}

export interface PinAssociation {
  uuid: string;
  name: string;
  type: AssociationType;
}
