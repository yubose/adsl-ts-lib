/// <reference types="lodash" />
import { Loader } from 'noodl-loader';
import type { CreatePageArgs, CreatePagesArgs, CreateSchemaCustomizationArgs, CreateWebpackConfigArgs, NodePluginArgs, SourceNodesArgs } from 'gatsby';
import * as t from './types';
export interface CreateGatsbyNodeWrapperOptions {
    loader?: Loader;
}
export declare function createGatsbyNodeWrapper({ loader, }?: CreateGatsbyNodeWrapperOptions): {
    onPluginInit: import("lodash").CurriedFunction3<import("./internal").WrappedHookFn<NodePluginArgs, "pluginInit">, NodePluginArgs, t.GatsbyNoodlPluginOptions, any>;
    sourceNodes: import("lodash").CurriedFunction3<import("./internal").WrappedHookFn<SourceNodesArgs, "sourceNodes">, SourceNodesArgs, t.GatsbyNoodlPluginOptions, any>;
    createPages: import("lodash").CurriedFunction3<import("./internal").WrappedHookFn<CreatePagesArgs, "createPages">, CreatePagesArgs, t.GatsbyNoodlPluginOptions, any>;
    onCreatePage: import("lodash").CurriedFunction3<import("./internal").WrappedHookFn<CreatePageArgs<Record<string, unknown>>, "onCreatePage">, CreatePageArgs<Record<string, unknown>>, t.GatsbyNoodlPluginOptions, any>;
    createSchemaCustomization: import("lodash").CurriedFunction3<import("./internal").WrappedHookFn<CreateSchemaCustomizationArgs, "createSchemaCustomization">, CreateSchemaCustomizationArgs, t.GatsbyNoodlPluginOptions, any>;
    createWebpackConfig: import("lodash").CurriedFunction3<import("./internal").WrappedHookFn<CreateWebpackConfigArgs, "createWebpackConfig">, CreateWebpackConfigArgs, t.GatsbyNoodlPluginOptions, any>;
    setCurrentWorkingDirectory(cwd: string): void;
};
