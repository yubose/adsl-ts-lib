export const _symbol = {
  fs: Symbol('fileSystem'),
  root: Symbol('DocRoot'),
} as const

export enum Kind {
  Unknown = 0,
  Scalar = 1,
  Pair = 2,
  Map = 3,
  Seq = 4,
  Document = 5,
}

export enum ScalarType {
  Unknown = 10,
  String = 11,
  Number = 12,
  Object = 13,
  Array = 14,
  Boolean = 15,
  Null = 16,
  Undefined = 17,
}

export enum ScalarKind {
  Unknown = 20,
  Reference = 21,
  ContentType = 22,
}

export enum MapKind {
  Unknown = 100,
  Action = 101,
  Component = 102,
  Emit = 103,
  Goto = 104,
  If = 105,
  Style = 106,
  BuiltInFn = 107,
}

export enum SeqKind {
  UserEvent = 200,
  Actions = 201,
  EvalObject = 202,
}

export enum IfItemKind {
  Condition = 1,
  Truthy = 2,
  Falsey = 3,
}

export enum ProcessWriteType {
  Unknown = 10100,
  LocalMerge = 10101,
  RootMerge = 10102,
  AtMerge = 10103,
}

export enum VisitorHistoryStatus {
  Resolved = 1,
  Error = 2,
}

export enum VisitorQueueStatus {
  Visited = 0,
  Pending = 1,
  Error = 2,
}
