/// <reference types="lodash" />
import type { Loader } from 'noodl-loader';
import type { NodePluginArgs, Reporter } from 'gatsby';
import type { Metadata } from './metadata';
import * as t from './types';
export interface WrappedHookFn<Args, HookEvt extends keyof t.Hooks> {
    (_: Args, opts: t.GatsbyNoodlPluginOptions, helpers: t.HookHelpers<HookEvt>): void;
}
export declare function getDefaultHooks(): t.Hooks;
export declare function getPaths(meta: Metadata): ReturnType<t.HookHelpers<any>['getPaths']>;
export declare function getGatsbyNodeHandlers({ getHelpers, meta, setReporter, }: {
    getHelpers: <HookEvt extends keyof t.Hooks>(evt: HookEvt, opts: t.GatsbyNoodlPluginOptions) => t.HookHelpers<HookEvt>;
    meta: Metadata;
    setReporter: (reporter: Reporter) => void;
}): {
    createLifeCycleHandler: <Args extends NodePluginArgs, Evt extends keyof t.Hooks>(evt: Evt, fn: (_: Args, opts: t.GatsbyNoodlPluginOptions, helpers: t.HookHelpers<Evt>) => Promise<void> | void) => import("lodash").CurriedFunction3<WrappedHookFn<Args, Evt>, Args, t.GatsbyNoodlPluginOptions, any>;
    handleConfigSettings: (loader: Loader, meta: Metadata, arg: t.GatsbyNoodlPluginOptions['config']) => void;
};
