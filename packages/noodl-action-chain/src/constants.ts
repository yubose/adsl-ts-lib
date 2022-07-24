import { actionTypes as _actionTypes } from 'noodl-types'

// ActionChain statuses
export const IDLE = 'idle'
export const IN_PROGRESS = 'in.progress'
export const ABORTED = 'aborted'
export const ERROR = 'error'
export const PENDING = 'pending'
export const RESOLVED = 'resolved'
export const TIMED_OUT = 'timed.out'

// ActionChain observe events
export const ON_ABORT = 'on.abort'
export const ON_STATUS = 'on.status'
export const ON_REFRESH = 'on.refresh'

// ActionChain default triggers
export const trigger = {
	ON_BLUR: 'onBlur',
	ON_CLICK: 'onClick',
	ON_CHANGE: 'onChange',
	ON_HOVER: 'onHover',
	ON_MOUSEENTER: 'onMouseEnter',
	ON_MOUSELEAVE: 'onMouseLeave',
	ON_MOUSEOUT: 'onMouseOut',
	ON_MOUSEOVER: 'onMouseOver',
} as const

export const REFRESH = 'refresh'

export const triggers = Object.values(trigger)
