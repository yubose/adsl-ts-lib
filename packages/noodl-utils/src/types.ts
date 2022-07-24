export type QueryObj<O extends Record<string, any> = any> =
	| O
	| ((...args: any[]) => O)

export interface ParsedGotoUrlObject {
	destination: string
	id: string
	isSamePage?: boolean
	duration: number
}

export interface ParsedPageComponentUrlObject<
	TargetPage extends string = string,
	CurrentPage extends string = string,
	ViewTag extends string = string,
> {
	targetPage: TargetPage
	currentPage: CurrentPage
	viewTag: ViewTag
}
