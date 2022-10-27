import type { NodePluginArgs } from 'gatsby';
import type { Loader } from 'noodl-loader';
import * as t from './types';
export declare function extractAssets(loader: Loader): (gatsbyArgs: NodePluginArgs, pluginOptions: t.GatsbyNoodlPluginOptions, helpers: t.HookHelpers<'pluginInit'>) => Promise<void>;
