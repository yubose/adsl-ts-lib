import {
  actionTypes as noodlTypesActionTypes,
  componentTypes as noodlComponentTypes,
  userEvent,
} from 'noodl-types'
import type { NUIActionType } from './types'

// Extended constants from this lib
export const lib = {
  actionTypes: ['anonymous', 'emit', 'goto', 'toast'],
  components: ['br', 'span'],
  emitTriggers: [
    'dataKey',
    'dataValue',
    'path',
    'validateField',
    'LoadStyle',
    'placeholder',
    'postMessage',
    'dataOption',
    'videoOption',
    'register',
  ],
  dataAttributes: [
    'data-key',
    'data-listid',
    'data-name',
    'data-globalid',
    'data-options',
    'data-placeholder',
    'data-src',
    'data-value',
    'data-option',
    'data-viewtag',
    'data-ux',
  ],
} as const

export const actionTypes = [...noodlTypesActionTypes, ...lib.actionTypes]
export const componentTypes = [...noodlComponentTypes, ...lib.components]

export const triggers = [
  ...lib.emitTriggers,
  ...userEvent,
  'onInput',
  'postMessage',
]

export const cache = {
  page: {
    hooks: {
      PAGE_CREATED: 'PAGE_CREATED',
      PAGE_REMOVED: 'PAGE_REMOVED',
      PAGE_UPDATED: 'PAGE_UPDATED',
    },
  },
} as const

export const groupedActionTypes = actionTypes.filter(
  (t) => !/(builtIn|emit|register)/i.test(t),
) as Exclude<NUIActionType, 'builtIn' | 'emit' | 'register'>[]

export const presets = {
  border: {
    '1': { borderStyle: 'none', borderRadius: '0px' },
    '2': {
      borderRadius: '0px',
      borderStyle: 'none',
      borderBottomStyle: 'solid',
    },
    '3': { borderStyle: 'solid' },
    '4': { borderStyle: 'dashed', borderRadius: '0px' },
    '5': { borderStyle: 'none' },
    '6': { borderStyle: 'solid', borderRadius: '0px' },
    '7': { borderBottomStyle: 'solid', borderRadius: '0px' },
  },
}

export const nuiEvent = {
  component: {
    list: {
      ADD_DATA_OBJECT: 'ADD_DATA_OBJECT',
      DELETE_DATA_OBJECT: 'DELETE_DATA_OBJECT',
    },
    page: {
      PAGE_CREATED: 'PAGE_CREATED',
      PAGE_CHANGED: 'PAGE_CHANGED',
      PAGE_COMPONENTS: 'PAGE_COMPONENTS',
    },
    textField: {
      placeholder: 'PLACEHOLDER',
    },
  },
} as const

export const nuiEmitType = {
  REGISTER: 'register',
  TRANSACTION: 'transaction',
} as const

export const nuiEmitTransaction = {
  REQUEST_PAGE_OBJECT: 'REQUEST_PAGE_OBJECT',
} as const

export const trigger = {
  DATA_KEY: 'dataKey',
  DATA_VALUE: 'dataValue',
  PATH: 'path',
  PLACEHOLDER: 'placeholder',
  POST_MESSAGE: 'postMessage',
  REGISTER: 'register',
  ON_BLUR: 'onBlur',
  ON_CLICK: 'onClick',
  ON_CHANGE: 'onChange',
  ON_HOVER: 'onHover',
  ON_MOUSEENTER: 'onMouseEnter',
  ON_MOUSELEAVE: 'onMouseLeave',
  DATA_OPTION: 'dataOption',
  VIDEO_OPTION: 'videoOption',
  ON_MOUSEOUT: 'onMouseOut',
  ON_MOUSEOVER: 'onMouseOver',
  ON_LAZYLOADING: 'onLazyLoading',
} as const

/* -------------------------------------------------------
  ---- DOM
-------------------------------------------------------- */

export const ARIA_LABELLEDBY = 'aria-labelledby'
export const ARIA_HIDDEN = 'aria-hidden'
export const ARIA_LABEL = 'aria-label'
export const BASE_PAGE_URL = 'index.html?'
export const CONTENT_SECURITY_POLICY = 'Content-Security-Policy'

export const classes = {
  ECOS_DOC: 'ecosdoc',
  ECOS_DOC_IMAGE: 'ecosdoc-image',
  ECOS_DOC_PDF: 'ecosdoc-pdf',
  ECOS_DOC_TEXT: 'ecosdoc-text',
  ECOS_DOC_TEXT_TITLE: 'ecosdoc-text-title',
  ECOS_DOC_TEXT_BODY: 'ecosdoc-text-body',
  ECOS_DOC_TEXT_PLAIN: 'ecosdoc-textplain',
  ECOS_DOC_TEXT_MARKDOWN: 'ecosdoc-textmarkdown',
  ECOS_DOC_TEXT_CSS: 'ecosdoc-textcss',
  ECOS_DOC_TEXT_HTML: 'ecosdoc-texthtml',
  ECOS_DOC_TEXT_JAVASCRIPT: 'ecosdoc-textjs',
  ECOS_DOC_NOTE: 'ecosdoc-note',
  ECOS_DOC_NOTE_TITLE: 'ecosdoc-note-title',
  ECOS_DOC_NOTE_DATA: 'ecosdoc-note-data',
  ECOS_DOC_VIDEO: 'ecosdoc-video',
  GLOBAL: 'global',
  PAGE: 'page',
  PLUGIN_HEAD: 'pluginHead',
  PLUGIN_BODY_TOP: 'pluginBodyTop',
  PLUGIN_BODY_TAIL: 'pluginBodyTail',
  POPUP: 'popup',
  POPUP_GLOBAL: 'popup-global',
  SCROLL_VIEW: 'scroll-view',
  TEXT_BOARD: 'text-board',
} as const
export const CREATE_GLOBAL_ID = 'CREATE_GLOBAL_ID'
export const DATA_KEY = 'data-key'
export const DATA_VALUE = 'data-value'
export const DATA_NAME = 'data-name'
export const DATA_SRC = 'data-src'
export const DATA_GLOBALID = 'data-globalid'
export const DATA_LISTID = 'data-listid'
export const DATA_OPTIONS = 'data-options'
export const DATA_OPTION = 'data-option'
export const DATA_PLACEHOLDER = 'data-placeholder'
export const DATA_VIEWTAG = 'data-viewtag'
export const DATA_UX = 'data-ux'

export const eventId = {
  componentPage: {
    on: {
      ON_LOAD: 'ON_LOAD',
      ON_ERROR: 'ON_ERROR',
      ON_MESSAGE: 'ON_MESSAGE',
    },
  },
  page: {
    /** Sorted by order of occurrence */
    on: {
      ON_ASPECT_RATIO_MIN: 'ON_ASPECT_RATIO_MIN',
      ON_ASPECT_RATIO_MAX: 'ON_ASPECT_RATIO_MAX',
      ON_STATUS_CHANGE: 'ON_STATUS_CHANGE',
      ON_NAVIGATE_START: 'ON_NAVIGATE_START',
      ON_NAVIGATE_STALE: 'ON_NAVIGATE_STALE',
      ON_DOM_CLEANUP: 'ON_DOM_CLEANUP',
      ON_BEFORE_RENDER_COMPONENTS: 'ON_BEFORE_RENDER_COMPONENTS',
      ON_APPEND_NODE: 'ON_APPEND_NODE',
      ON_BEFORE_CLEAR_ROOT_NODE: 'ON_BEFORE_CLEAR_ROOT_NODE',
      ON_REDRAW_BEFORE_CLEANUP: 'ON_REDRAW_BEFORE_CLEANUP',
      ON_COMPONENTS_RENDERED: 'ON_COMPONENTS_RENDERED',
      ON_NAVIGATE_ERROR: 'ON_NAVIGATE_ERROR',
      ON_SET_ROOT_NODE: 'ON_SET_ROOT_NODE',
    },
    /** Sorted by order of occurrence */
    status: {
      ANY: 'ANY',
      IDLE: 'IDLE',
      NAVIGATING: 'NAVIGATING',
      NAVIGATE_ERROR: 'NAVIGATE_ERROR',
      SNAPSHOT_RECEIVED: 'SNAPSHOT_RECEIVED',
      RESOLVING_COMPONENTS: 'RESOLVING_COMPONENTS',
      COMPONENTS_RECEIVED: 'COMPONENTS_RECEIVED',
      RENDERING_COMPONENTS: 'RENDERING_COMPONENTS',
      COMPONENTS_RENDERED: 'COMPONENTS_RENDERED',
    },
  },
} as const

export const PAGE_CREATED = 'PAGE_CREATED'
export const PAGE_CHANGED = 'PAGE_CHANGED'
export const PAGE_REMOVED = 'PAGE_REMOVED'
