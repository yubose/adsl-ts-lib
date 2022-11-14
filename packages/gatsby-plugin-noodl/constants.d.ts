export declare enum Paths {
    Output = "Output",
    Src = "Src",
    Template = "Template"
}
export declare enum Init {
    Initialized = "initialized",
    NotInitialized = "not-initialized"
}
export declare const defaultConfigKey = "aitmed";
export declare const defaultOutputPath = "output";
export declare const defaultSrcPath = "src";
export declare const defaultTemplatePath: string;
/**
 * Large screen / Desktop
 */
export declare const defaultViewport: {
    readonly width: 1024;
    readonly height: 768;
};
export declare const noodlPageNodeType = "NoodlPage";
export declare const preInitHook: {
    readonly enter: "enter-pre-init";
    readonly currentWorkingDirectory: "set-current-working-directory";
    readonly outputPath: "set-output-path";
    readonly srcPath: "set-src-path";
    readonly templatePath: "set-template-path";
    readonly patchingVercelToast: "patching-vercel-toast";
    readonly exit: "exit-pre-init";
};
export declare const pluginInitHook: {
    readonly enter: "enter-plugin-init";
    readonly configSettings: "set-config-settings";
    readonly paths: "set-paths";
    readonly beforeLoad: "before-load";
    readonly afterLoad: "after-load";
    readonly download: "file-downloaded";
    readonly updateFileLocation: "update-file-location";
    readonly exit: "exit-plugin-init";
};
export declare const sourceNodesHook: {
    readonly enter: "enter-source-nodes";
    readonly setViewport: "set-viewport";
    readonly startingSandbox: "starting-sandbox";
    readonly sandboxStarted: "sandbox-started";
    readonly initiatingLevel3: "initiating-level-3";
    readonly initiatedLevel3: "initiated-level-3";
    readonly cacheDirectory: "set-cache-directory";
    readonly patchingEventListener: "patching-event-listener";
    readonly patchedEventListener: "patched-event-listener";
    readonly componentsGenerated: "components-generated";
    readonly exit: "exit-source-nodes";
};
export declare const createPagesHook: {
    readonly enter: "enter-create-pages";
    readonly pageNodes: "noodl-page-nodes";
    readonly creatingPageRoute: "creating-page-route";
    readonly createdPageRoute: "created-page-route";
    readonly exit: "exit-create-pages";
};
export declare const onCreatePageHook: {
    readonly enter: "enter-on-create-page";
    readonly boundHomePage: "bound-home-page";
    readonly exit: "exit-on-create-page";
};
export declare const createSchemaCustomizationHook: {
    readonly enter: "enter-create-schema-customization";
    readonly creatingGraphQLObjectType: "creating-graphql-object-type";
    readonly createdGraphQLObjectType: "created-graphql-object-type";
    readonly exit: "enter-create-schema-customization";
};
export declare const createWebpackConfigHook: {
    readonly enter: "enter-create-webpack-config";
    readonly exit: "exit-create-webpack-config";
};
