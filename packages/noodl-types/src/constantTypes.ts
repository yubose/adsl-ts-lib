import * as c from './constants'

export type ActionType = typeof c.actionTypes[number]
export type ComponentType = typeof c.componentTypes[number]
export type ContentType = typeof c.contentTypes[number]
export type EventType = typeof c.userEvent[number]
