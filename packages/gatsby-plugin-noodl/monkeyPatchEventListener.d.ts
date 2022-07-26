export interface OnPatch {
    addEventListener: (...args: any[]) => any;
    removeEventListener: (...args: any[]) => any;
}
/**
 * Returns the path to the EventTarget file so it can be patched
 * @returns { string[] }
 */
export declare function getPathsToEventTargetFile(): string[];
/**
 * addEventListener is preving sdk from sandboxing.
 * We must monkey patch the EventTarget
 */
export default function monkeyPatchAddEventListener(opts: {
    onPatch?: OnPatch;
}): void;
