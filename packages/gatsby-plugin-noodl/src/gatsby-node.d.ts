import type { CreatePagesArgs, CreatePageArgs, CreateSchemaCustomizationArgs, NodePluginArgs, SourceNodesArgs } from 'gatsby';
import * as t from './types';
export declare const paths: {
    output: string;
    src: string;
    template: string;
};
/**
 * @param { opts:{ paths?: any } } args
 * @returns { Promise<import('./types').DumpedMetadata> }
 */
export declare const dumpMetadata: ({ paths: pathsProp, write, ...other }?: {
    paths?: string[] | undefined;
    write?: boolean | undefined;
} & Record<string, any>) => Promise<any>;
export declare const reset: () => void;
/**
 * https://www.gatsbyjs.com/docs/node-apis/
 */
export declare const onPreInit: (_: NodePluginArgs, pluginOpts: t.GatsbyNoodlPluginOptions) => void;
export declare const onPluginInit: (args: NodePluginArgs, pluginOpts?: t.GatsbyNoodlPluginOptions) => Promise<void>;
export declare const sourceNodes: (args: SourceNodesArgs, pluginOpts: t.GatsbyNoodlPluginOptions) => Promise<void>;
export declare const createPages: (args: CreatePagesArgs, pluginOpts: t.GatsbyNoodlPluginOptions) => Promise<void>;
export declare function onCreatePage(opts: CreatePageArgs): Promise<void>;
export declare const createSchemaCustomization: ({ actions, schema, }: CreateSchemaCustomizationArgs) => void;
