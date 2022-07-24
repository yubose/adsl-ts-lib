import ActionChain from '../ActionChain'
import isAction from './isAction'

function isActionChain(obj: unknown): obj is ActionChain {
	return !!(
		obj &&
		typeof obj === 'object' &&
		!isAction(obj) &&
		('queue' in obj || 'loadQueue' in obj)
	)
}

export default isActionChain
