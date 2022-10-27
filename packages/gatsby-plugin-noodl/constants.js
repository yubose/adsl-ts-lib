"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebpackConfigHook = exports.createSchemaCustomizationHook = exports.onCreatePageHook = exports.createPagesHook = exports.sourceNodesHook = exports.pluginInitHook = exports.preInitHook = exports.noodlPageNodeType = exports.defaultViewport = exports.defaultTemplatePath = exports.defaultSrcPath = exports.defaultOutputPath = exports.defaultConfigKey = exports.Init = exports.Paths = void 0;
const path_1 = require("path");
var Paths;
(function (Paths) {
    Paths["Output"] = "Output";
    Paths["Src"] = "Src";
    Paths["Template"] = "Template";
})(Paths = exports.Paths || (exports.Paths = {}));
var Init;
(function (Init) {
    Init["Initialized"] = "initialized";
    Init["NotInitialized"] = "not-initialized";
})(Init = exports.Init || (exports.Init = {}));
exports.defaultConfigKey = 'aitmed';
exports.defaultOutputPath = 'output';
exports.defaultSrcPath = 'src';
exports.defaultTemplatePath = (0, path_1.join)(exports.defaultSrcPath, 'templates/page.tsx');
/**
 * Large screen / Desktop
 */
exports.defaultViewport = {
    width: 1024,
    height: 768,
};
exports.noodlPageNodeType = 'NoodlPage';
exports.preInitHook = {
    enter: 'enter-pre-init',
    currentWorkingDirectory: 'set-current-working-directory',
    outputPath: 'set-output-path',
    srcPath: 'set-src-path',
    templatePath: 'set-template-path',
    patchingVercelToast: 'patching-vercel-toast',
    exit: 'exit-pre-init',
};
exports.pluginInitHook = {
    enter: 'enter-plugin-init',
    configSettings: 'set-config-settings',
    paths: 'set-paths',
    beforeLoad: 'before-load',
    afterLoad: 'after-load',
    download: 'file-downloaded',
    updateFileLocation: 'update-file-location',
    exit: 'exit-plugin-init',
};
exports.sourceNodesHook = {
    enter: 'enter-source-nodes',
    setViewport: 'set-viewport',
    startingSandbox: 'starting-sandbox',
    sandboxStarted: 'sandbox-started',
    initiatingLevel3: 'initiating-level-3',
    initiatedLevel3: 'initiated-level-3',
    cacheDirectory: 'set-cache-directory',
    patchingEventListener: 'patching-event-listener',
    patchedEventListener: 'patched-event-listener',
    componentsGenerated: 'components-generated',
    // introspection: 'introspection',
    exit: 'exit-source-nodes',
};
exports.createPagesHook = {
    enter: 'enter-create-pages',
    pageNodes: 'noodl-page-nodes',
    creatingPageRoute: 'creating-page-route',
    createdPageRoute: 'created-page-route',
    exit: 'exit-create-pages',
};
exports.onCreatePageHook = {
    enter: 'enter-on-create-page',
    boundHomePage: 'bound-home-page',
    exit: 'exit-on-create-page',
};
exports.createSchemaCustomizationHook = {
    enter: 'enter-create-schema-customization',
    creatingGraphQLObjectType: 'creating-graphql-object-type',
    createdGraphQLObjectType: 'created-graphql-object-type',
    exit: 'enter-create-schema-customization',
};
exports.createWebpackConfigHook = {
    enter: 'enter-create-webpack-config',
    exit: 'exit-create-webpack-config',
};
//# sourceMappingURL=constants.js.map