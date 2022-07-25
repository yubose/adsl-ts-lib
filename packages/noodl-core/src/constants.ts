/** @internal */
export const _symbol = {
  diagnostic: Symbol('DIAGNOSTIC'),
  root: Symbol('ROOT'),
} as const

/* -------------------------------------------------------
  ---- STYLES
-------------------------------------------------------- */
/** @internal */
export const xKeys = ['width', 'left'] as const
/** @internal */
export const yKeys = ['height', 'top', 'marginTop'] as const
/** @internal */
export const posKeys = [...xKeys, ...yKeys] as const

// Style keys that map their values relative to the viewport's height
/** @internal */
export const vpHeightKeys = [
  ...yKeys,
  'borderRadius',
  'fontSize',
  'paddingTop',
  'paddingBottom',
  'marginBottom',
] as const

/** @internal */
export const vpWidthKeys = [
  ...xKeys,
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
] as const

/** @internal */
export const textAlignStrings = [
  'left',
  'center',
  'right',
  'centerX',
  'centerY',
] as const

export enum ReferenceType {
  AWAIT = 0,
  ROOT_MERGE = 1,
  LOCAL_MERGE = 2,
  EVAL_ROOT_MERGE = 3,
  EVAL_LOCAL_MERGE = 4,
  EVAL_BUILT_IN = 5,
  TILDE = 6,
  TRAVERSE = 7,
}

/** @internal */
export enum ValidatorType {
  ERROR = 9000,
  WARN = 9001,
  INFO = 9002,
}

// prettier-ignore
/** @internal */
export  enum CharCode {
  Ampersand = 0x26,             // &
  Asterisk = 0x2A,              // *
  At = 0x40,                    // @
  Backspace = 0x08,             // \b
  Backtick = 0x60,              // `
  Backslash = 0x5C,             // \
  Bar = 0x7C,                   // |
  Caret = 0x5E,                 // ^
  CloseBrace = 0x7D,            // }
  CloseBracket = 0x5D,          // ]
  CloseParen = 0x29,            // )
  Colon = 0x3A,                 // :
  Comma = 0x2C,                 // ,
  Dot = 0x2E,                   // .
  Dollar = 0x24,                // $
  DoubleQuote = 0x22,           // "
  Equals = 0x3D,                // =
  Exclamation = 0x21,           // !
  GreaterThan = 0x3E,           // >
  Hash = 0x23,                  // #
  LessThan = 0x3C,              // <
  Minus = 0x2D,                 // -
  Null = 0,
  OpenBrace = 0x7B,             // {
  OpenBracket = 0x5B,           // [
  OpenParen = 0x28,             // (
  Percent = 0x25,               // %
  Plus = 0x2B,                  // +
  Question = 0x3F,              // ?
  Semicolon = 0x3B,             // ;
  SingleQuote = 0x27,           // '
  Slash = 0x2F,                 // /
  Tilde = 0x7E,                 // ~
  FormFeed = 0x0C,              // \f
  ByteOrderMark = 0xFEFF,
  Tab = 0x09,                   // \t
  VerticalTab = 0x0B,           // \v
  Underline = 0x5F,

  CarriageReturn = 0x0D,        // \r
  LineFeed = 0x0A,              // \n
  LineSeparator = 0x2028,
  NextLine = 0x0085,
  ParagraphSeparator = 0x2029,

  A = 0x41,
  B = 0x42,
  C = 0x43,
  D = 0x44,
  E = 0x45,
  F = 0x46,
  G = 0x47,
  H = 0x48,
  I = 0x49,
  J = 0x4A,
  K = 0x4B,
  L = 0x4C,
  M = 0x4D,
  N = 0x4E,
  O = 0x4F,
  P = 0x50,
  Q = 0x51,
  R = 0x52,
  S = 0x53,
  T = 0x54,
  U = 0x55,
  V = 0x56,
  W = 0x57,
  X = 0x58,
  Y = 0x59,
  Z = 0x5a,

  a = 0x61,
  b = 0x62,
  c = 0x63,
  d = 0x64,
  e = 0x65,
  f = 0x66,
  g = 0x67,
  h = 0x68,
  i = 0x69,
  j = 0x6A,
  k = 0x6B,
  l = 0x6C,
  m = 0x6D,
  n = 0x6E,
  o = 0x6F,
  p = 0x70,
  q = 0x71,
  r = 0x72,
  s = 0x73,
  t = 0x74,
  u = 0x75,
  v = 0x76,
  w = 0x77,
  x = 0x78,
  y = 0x79,
  z = 0x7A,

  _0 = 0x30,
  _1 = 0x31,
  _2 = 0x32,
  _3 = 0x33,
  _4 = 0x34,
  _5 = 0x35,
  _6 = 0x36,
  _7 = 0x37,
  _8 = 0x38,
  _9 = 0x39,
}

/* @internal */
export enum Comparison {
  LessThan = -1,
  EqualTo = 0,
  GreaterThan = 1,
}

export enum DiagnosticCode {
  LOCAL_REF_MISSING_ROOT_KEY = 20000,
  ROOT_REF_MISSING_ROOT_KEY = 20001,
  ROOT_MISSING_ROOT_KEY = 20002,
  ROOT_VALUE_EMPTY = 20003,
  REFERENCE_UNRESOLVABLE = 20004,
  ROOT_REFERENCE_SECOND_LEVEL_KEY_UPPERCASE = 20100,
  TRAVERSAL_REF_INCOMPLETE_MISSING_KEY = 20199,
  GOTO_PAGE_MISSING_FROM_APP_CONFIG = 30000,
  GOTO_PAGE_INVALID = 30001,
  GOTO_PAGE_COMPONENT_URL_CURRENT_PAGE_INVALID = 30002,
  GOTO_PAGE_COMPONENT_URL_TARGET_PAGE_INVALID = 30003,
  GOTO_PAGE_COMPONENT_URL_VIEW_TAG_INVALID = 30004,
  GOTO_PAGE_EMPTY = 30005,
  GOTO_PAGE_MISSING_FROM_ROOT = 30006,
  VIEW_TAG_INVALID = 30500,
  VIEW_TAG_MISSING_COMPONENT_POINTER = 30501,
  POPUP_VIEW_INVALID = 30600,
  POPUP_VIEW_MISSING_COMPONENT_POINTER = 30601,
  BUILTIN_FUNCTION_MISSING = 40000,
  BUILTIN_FUNCTION_NOT_A_FUNCTION = 40001,
}
