import {
	ActionObject,
	BuiltInActionObject,
	EvalActionObject,
	PageJumpActionObject,
	PopupActionObject,
	PopupDismissActionObject,
	RefreshActionObject,
	SaveActionObject,
	UpdateActionObject,
	EventType,
} from 'noodl-types'
import { LiteralUnion } from 'type-fest'
import { ActionChainInstancesLoader } from '../types'
import ActionChain from '../ActionChain'
import Action from '../Action'

export interface MockGetActionChainOptions {
	actions: (ActionObject | MockGetActionChainExtendedActionsArg)[]
	load?: boolean
	loader?: ActionChainInstancesLoader
	trigger?: LiteralUnion<EventType, string>
	use?: Parameters<ActionChain['use']>[0]
}

export interface MockGetActionChainExtendedActionsArg {
	action: ActionObject
	fn: (...args: any[]) => any
}

export function getActionChain(args: MockGetActionChainOptions) {
	const { actions, trigger, loader, load = true, use } = args
	const isExtendedActions = 'fn' in actions[0] || 'action' in actions[0]

	const getInstance = (obj: ActionObject) => {
		const action = new Action(trigger, obj)

		if (isExtendedActions) {
			const o = actions.find(
				(o) => o.action === obj,
			) as MockGetActionChainExtendedActionsArg
			// Convenience if they want to provide spies
			typeof o?.fn === 'function' && (action.executor = o.fn)
		}

		return action
	}

	const ac = new ActionChain(
		trigger,
		(isExtendedActions
			? actions.map((o) => o.action)
			: actions) as ActionObject[],
		(actions) =>
			// @ts-expect-error
			loader ? loader(actions) : actions.map((a) => getInstance(a)),
	)

	use && ac.use(use)
	load && ac.loadQueue()
	return ac
}

export function getBuiltInAction(
	props?: Partial<BuiltInActionObject>,
): BuiltInActionObject {
	return { actionType: 'builtIn', funcName: 'hello', ...props }
}

export function getEvalObjectAction(
	props?: Partial<EvalActionObject>,
): EvalActionObject {
	return { actionType: 'evalObject', object: {}, ...props }
}

export function getPageJumpAction(
	props?: Partial<PageJumpActionObject>,
): PageJumpActionObject {
	return { actionType: 'pageJump', destination: 'SignIn', ...props }
}

export function getPopUpAction(
	props?: Partial<PopupActionObject>,
): PopupActionObject {
	return { actionType: 'popUp', popUpView: 'genderView', ...props }
}

export function getPopUpDismissAction(
	props?: Partial<PopupDismissActionObject>,
): PopupDismissActionObject {
	return { actionType: 'popUpDismiss', popUpView: 'warningView', ...props }
}

export function getRefreshAction(
	props?: Partial<RefreshActionObject>,
): RefreshActionObject {
	return { actionType: 'refresh', ...props }
}

export function getSaveObjectAction(
	props?: Partial<SaveActionObject>,
): SaveActionObject {
	return { actionType: 'saveObject', object: {}, ...props }
}

export function getUpdateObjectAction(props?: Partial<UpdateActionObject>) {
	return {
		actionType: 'updateObject',
		object: { '.Global.refid@': '___.itemObject.id' },
		...props,
	}
}
