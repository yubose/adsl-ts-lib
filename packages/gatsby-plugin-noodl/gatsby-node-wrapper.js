"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGatsbyNodeWrapper = void 0;
const tslib_1 = require("tslib");
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
const noodl_loader_1 = require("noodl-loader");
const webpack_1 = require("webpack");
const get_1 = tslib_1.__importDefault(require("lodash/get"));
const has_1 = tslib_1.__importDefault(require("lodash/has"));
const set_1 = tslib_1.__importDefault(require("lodash/set"));
const path_1 = tslib_1.__importDefault(require("path"));
const patch_vercel_toast_1 = require("./patch-vercel-toast");
const cache_1 = require("./cache");
const utils_1 = tslib_1.__importDefault(require("./utils"));
const metadata_1 = require("./metadata");
const internal_1 = require("./internal");
const c = tslib_1.__importStar(require("./constants"));
(0, patch_vercel_toast_1.patchVercelToast)(
// @ts-expect-error
{ error: console.error, verbose: console.log }, process.cwd(), {
    directoryFound(directory, filepath, pkgJson) {
        console.log(`Patching ${u.cyan('vercel-toast')} ${u.yellow(filepath)}`);
    },
});
const { yellow } = u;
let _configKey = '';
function createGatsbyNodeWrapper({ loader = new noodl_loader_1.Loader(), } = {}) {
    const fs = loader.getFileSystem();
    const { resolvePaths: r } = utils_1.default;
    let _cache;
    let _meta = (0, metadata_1.createMetadata)({ loader });
    let _reporter;
    let _initiatedPluginInit = false;
    let _initiatedSourceNodes = false;
    let _initiatedCreatePages = false;
    // Lvl 3 SDK cache
    let _scache;
    let _handlers = (0, internal_1.getGatsbyNodeHandlers)({
        getHelpers,
        meta: _meta,
        setReporter(reporter) {
            _reporter = reporter;
        },
    });
    let _hooks = (0, internal_1.getDefaultHooks)();
    function _getPageRefs(pageName) {
        var _a;
        return ((_a = _scache === null || _scache === void 0 ? void 0 : _scache.refs) === null || _a === void 0 ? void 0 : _a[pageName]) || {};
    }
    function _emitHook(name, key, ...args) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (_hooks[name] && key in _hooks[name]) {
                // @ts-expect-error
                const fns = _hooks[name][key];
                if (u.isArr(fns)) {
                    try {
                        yield Promise.all(fns.map((fn) => {
                            try {
                                fn(...args);
                            }
                            catch (error) {
                                throw error instanceof Error ? error : new Error(String(error));
                            }
                        }));
                    }
                    catch (error) {
                        throw error instanceof Error ? error : new Error(String(error));
                    }
                }
            }
        });
    }
    function getHelpers(lifecycleEvent, pluginOptions) {
        return {
            getPaths: internal_1.getPaths,
            get log() {
                return _reporter.log;
            },
            get warn() {
                return _reporter.warn;
            },
            get success() {
                return _reporter.success;
            },
            get error() {
                return _reporter.error;
            },
            get verbose() {
                return _reporter === null || _reporter === void 0 ? void 0 : _reporter.verbose;
            },
            loader,
            meta: _meta,
            pluginOptions,
            subscribe(key, callback) {
                _registerHook(lifecycleEvent, key, callback);
            },
        };
    }
    function _registerHook(name, key, callback) {
        if (name in _hooks) {
            if (key in _hooks[name])
                _hooks[name][key].push(callback);
        }
    }
    // const onPreInit = _handlers.createLifeCycleHandler<PreInitArgs, 'preInit'>(
    //   'preInit',
    //   async (_, opts) => {
    //     await _emitHook('preInit', c.preInitHook.enter)
    //     _reporter.setVerbose(true)
    //     _meta.set('paths.cache', _.cache.directory)
    //     _meta.set('configKey', opts.config || c.defaultConfigKey)
    //     _meta.set('ecosEnv', opts.ecosEnv || 'stable')
    //     _meta.set('languageSuffix', 'en')
    //     _meta.set('loglevel', 'verbose')
    //     _meta.set('rootConfigUrl', loader.config.rootConfigUrl)
    //     _meta.set('startPage', opts?.startPage || '')
    //     _configKey = _meta.get('configKey')
    //     await _emitHook('preInit', c.preInitHook.enter)
    //     _meta.set('cwd', r(opts.cwd || process.cwd()))
    //     await _emitHook(
    //       'preInit',
    //       c.preInitHook.currentWorkingDirectory,
    //       _meta.get('cwd'),
    //     )
    //     for (const key of ['output', 'src', 'template']) {
    //       const datapath = `paths.${key}` as any
    //       if (has(opts, datapath)) {
    //         const constKey = c.preInitHook[`${key}Path`]
    //         const relativePath = get(opts, datapath) as string
    //         _meta.set(datapath, r(_meta.get('cwd'), relativePath))
    //         await _emitHook('preInit', constKey, _meta.get(datapath))
    //       } else {
    //         const setDefaultPath = async (key: 'output' | 'src' | 'template') => {
    //           const capitalizedKey = utils.capitalize(key)
    //           const constKey = c.preInitHook[`${key}Path`]
    //           const value = r(_meta.get('cwd'), c[`default${capitalizedKey}Path`])
    //           _meta.set(datapath, value)
    //           await _emitHook('preInit', constKey, value)
    //         }
    //         if (key === 'output') await setDefaultPath('output')
    //         if (key === 'src') await setDefaultPath('src')
    //         if (key === 'template') await setDefaultPath('template')
    //       }
    //       _meta.set(`paths.${key}` as any, r(get(opts, `paths.${key}`, '')))
    //     }
    //     await _emitHook('preInit', c.preInitHook.exit)
    //   },
    // )
    const onPluginInit = _handlers.createLifeCycleHandler('pluginInit', (_, opts, { error: e, verbose: v }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield _emitHook('pluginInit', c.pluginInitHook.enter);
        _reporter.setVerbose(true);
        _handlers.handleConfigSettings(loader, _meta, opts.config);
        _meta.set('paths.cache', _.cache.directory);
        _meta.set('ecosEnv', opts.ecosEnv || 'stable');
        _meta.set('languageSuffix', 'en');
        _meta.set('loglevel', 'verbose');
        _meta.set('rootConfigUrl', loader.config.rootConfigUrl);
        _meta.set('startPage', (opts === null || opts === void 0 ? void 0 : opts.startPage) || '');
        _configKey = _meta.get('configKey');
        yield _emitHook('preInit', c.preInitHook.enter);
        _meta.set('cwd', r(opts.cwd || process.cwd()));
        yield _emitHook('preInit', c.preInitHook.currentWorkingDirectory, _meta.get('cwd'));
        for (const key of ['output', 'src', 'template']) {
            const datapath = `paths.${key}`;
            if ((0, has_1.default)(opts, datapath)) {
                const constKey = c.preInitHook[`${key}Path`];
                const relativePath = (0, get_1.default)(opts, datapath);
                const filepath = r(_meta.getCurrentWorkingDirectory(), relativePath);
                _meta.set(datapath, filepath);
                yield _emitHook('preInit', constKey, filepath);
            }
            else {
                const setDefaultPath = (key) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const capitalizedKey = utils_1.default.capitalize(key);
                    const constKey = c.preInitHook[`${key}Path`];
                    const value = r(_meta.get('cwd'), c[`default${capitalizedKey}Path`]);
                    _meta.set(datapath, value);
                    yield _emitHook('preInit', constKey, value);
                });
                if (key === 'output')
                    yield setDefaultPath('output');
                if (key === 'src')
                    yield setDefaultPath('src');
                if (key === 'template')
                    yield setDefaultPath('template');
            }
        }
        yield _emitHook('preInit', c.preInitHook.exit);
        if (!_meta.get('configKey') && _configKey) {
            _meta.set('configKey', _configKey);
        }
        if (!_initiatedPluginInit) {
            _initiatedPluginInit = true;
            yield _emitHook('pluginInit', c.pluginInitHook.configSettings, {
                configKey: _meta.get('configKey'),
                configUrl: loader.createURL('config'),
                rootConfigUrl: _meta.get('rootConfigUrl'),
                ecosEnv: _meta.get('ecosEnv'),
                languageSuffix: _meta.get('languageSuffix'),
            });
            yield _emitHook('pluginInit', c.pluginInitHook.paths, (0, internal_1.getPaths)(_meta));
            yield utils_1.default.ensureDirectory(_meta.getOutputDirectory());
            yield utils_1.default.ensureDirectory(_meta.getAppDirectory());
            yield utils_1.default.ensureDirectory(_meta.getAssetsDirectory());
            for (const fnName of [
                'getOutputDirectory',
                'getAppDirectory',
                'getAssetsDirectory',
            ]) {
                if (!fs.existsSync(_meta[fnName]()))
                    yield fs.mkdir(_meta[fnName]());
            }
            v(`Yaml files will be located at ${yellow(_meta.getAppDirectory())}`);
            v(`Asset files will be located at ${yellow(_meta.getAssetsDirectory())}`);
            if (!fs.existsSync(_meta.getConfigPath())) {
                let msg = `You are missing the config file ${yellow(_meta.getConfigFileName())} `;
                msg += `It will be downloaded to ${_meta.getConfigPath()}`;
                v(msg);
            }
            const emitHookArgs = getHelpers('pluginInit', opts);
            const filepathHookFns = _hooks.pluginInit[c.pluginInitHook.updateFileLocation];
            yield _emitHook('pluginInit', c.pluginInitHook.beforeLoad, emitHookArgs);
            try {
                if (!loader.configKey) {
                    _meta.set('configKey', opts === null || opts === void 0 ? void 0 : opts.config);
                    loader.setConfigKey(_meta.get('configKey'));
                }
                if ((opts === null || opts === void 0 ? void 0 : opts.languageSuffix) !== undefined) {
                    loader.setFileLanguageSuffix(opts.languageSuffix);
                }
                yield loader.load({
                    on: {
                        filepath: filepathHookFns.length
                            ? (filepath) => {
                                return Promise.race(filepathHookFns.map((fn) => fn(filepath)));
                            }
                            : undefined,
                    },
                });
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                if ('isAxiosError' in err) {
                    const axiosErr = err;
                    const errResp = axiosErr.response;
                    console.log({
                        name: err.name,
                        message: err.message,
                        respData: errResp === null || errResp === void 0 ? void 0 : errResp.data,
                        respStatus: errResp === null || errResp === void 0 ? void 0 : errResp.status,
                        respStatusText: errResp === null || errResp === void 0 ? void 0 : errResp.statusText,
                    });
                }
                else {
                    console.error(`Error occurred while running loader.load() during onPluginInit: [${err.name}]: ${yellow(err.message)}`);
                    e(err);
                }
            }
            yield _emitHook('pluginInit', c.pluginInitHook.afterLoad, emitHookArgs);
        }
        yield _emitHook('pluginInit', c.pluginInitHook.exit);
    }));
    const sourceNodes = _handlers.createLifeCycleHandler('sourceNodes', ({ cache: gatsbyCache, actions: { createNode }, createContentDigest, createNodeId, }, opts, { error: e, meta, success: s, verbose: v }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield _emitHook('sourceNodes', c.sourceNodesHook.enter);
        if (!_initiatedSourceNodes) {
            _initiatedSourceNodes = true;
            try {
                const { viewport = {
                    width: c.defaultViewport.width,
                    height: c.defaultViewport.height,
                }, } = opts;
                // TODO - Move to preInit
                _meta.set('viewport', u.pick(viewport, ['width', 'height']));
                _cache = (0, cache_1.createCache)({
                    appKey: loader.appKey,
                    configKey: loader.configKey,
                    config: loader.config,
                    cadlEndpoint: loader.cadlEndpoint,
                    dir: path_1.default.join(gatsbyCache.directory, loader.configKey),
                });
                yield _emitHook('sourceNodes', c.sourceNodesHook.setViewport, viewport);
                // TODO - Check/Rehydrate here
                const { createSandbox } = yield Promise.resolve().then(() => tslib_1.__importStar(require('./sandbox')));
                yield _emitHook('sourceNodes', c.sourceNodesHook.sandboxStarted, {});
                yield createSandbox()
                    .then(function onCreateSandbox(window) {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        return [window, yield Promise.resolve().then(() => tslib_1.__importStar(require('@aitmed/cadl')))];
                    });
                })
                    .then(function ([window, { CADL, cache: sdkCache }]) {
                    var _a;
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        _scache = sdkCache;
                        const { init, generatePages, generateComponents } = yield Promise.resolve().then(() => tslib_1.__importStar(require('./generator')));
                        const { width, height } = meta.get('viewport') || {};
                        const lvl3 = yield init(CADL, {
                            cadlVersion: (opts === null || opts === void 0 ? void 0 : opts.ecosEnv) || 'stable',
                            configUrl: loader.createURL('config'),
                            on: {
                                initiatingLevel3: (lvl3) => {
                                    return _emitHook('sourceNodes', c.sourceNodesHook.initiatingLevel3, lvl3);
                                },
                                initiatedLevel3: (lvl3) => {
                                    var _a;
                                    const startPage = (_a = lvl3.cadlEndpoint) === null || _a === void 0 ? void 0 : _a.startPage;
                                    if (startPage)
                                        meta.set('startPage', startPage);
                                    return _emitHook('sourceNodes', c.sourceNodesHook.initiatedLevel3, lvl3);
                                },
                            },
                        });
                        const pageNames = [];
                        const pagesInSdk = u
                            .array((_a = lvl3.cadlEndpoint) === null || _a === void 0 ? void 0 : _a.page)
                            .filter(Boolean);
                        pagesInSdk.forEach((pageName) => {
                            if (pageName) {
                                if (!_cache.root[pageName])
                                    pageNames.push(pageName);
                                else
                                    v(`Rehydrating ${yellow(pageName)}`);
                            }
                        });
                        if (!pageNames.length && pagesInSdk.length) {
                            pageNames.push(...pagesInSdk);
                        }
                        yield generatePages({
                            pages: pageNames,
                            lvl3,
                            on: Object.assign({ 
                                /**
                                 * Create GraphQL nodes for app pages so they can be queried in the client side
                                 */
                                initPage: (pageName, pageObject, { nui }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                                    try {
                                        nui.getRootPage().page = pageName;
                                        nui.getRootPage().viewport.width = width;
                                        nui.getRootPage().viewport.height = height;
                                        _cache.root[pageName] = u.omit(pageObject, 'components');
                                        let pageContext = _cache.contexts[pageName];
                                        let pageRefs = _getPageRefs(pageName);
                                        if (!pageContext) {
                                            _cache.contexts[pageName] = pageContext =
                                                {};
                                        }
                                        if (!pageContext.lists)
                                            pageContext.lists = {};
                                        if (!pageContext.name)
                                            pageContext.name = pageName;
                                        if (!pageContext.refs)
                                            pageContext.refs = pageRefs;
                                        if (!pageContext.components) {
                                            const listOccurrences = [];
                                            pageContext.components = (yield generateComponents({
                                                components: pageObject.components || [],
                                                contexts: _cache.contexts,
                                                pageName,
                                                onResolvedListComponent(component) {
                                                    if (u.isObj(pageRefs)) {
                                                        for (let refObject of u.values(pageRefs)) {
                                                            if (refObject.key === 'listObject') {
                                                                let { path = '' } = refObject;
                                                                let componentPath = [];
                                                                let listObjectPath = path.split('.');
                                                                if (listObjectPath[0] === pageName) {
                                                                    listObjectPath = listObjectPath.slice(1);
                                                                }
                                                                if (listObjectPath[listObjectPath.length - 1] === 'listObject') {
                                                                    componentPath = listObjectPath.slice();
                                                                    componentPath.pop();
                                                                }
                                                                listOccurrences.push({
                                                                    component,
                                                                    paths: {
                                                                        component: componentPath.join('.'),
                                                                        listObject: listObjectPath.join('.'),
                                                                    },
                                                                    isLocal: refObject.isLocal,
                                                                    ref: refObject.ref,
                                                                });
                                                            }
                                                        }
                                                    }
                                                },
                                            })).map((comp) => comp.toJSON());
                                            for (const { component, paths, ref, } of listOccurrences) {
                                                const componentPath = paths.component;
                                                const listObjectPath = paths.listObject;
                                                const listObject = (0, get_1.default)(pageContext, listObjectPath);
                                                console.log(`listObject path -> ${u.green(listObjectPath)}`, { listObject });
                                                console.log(`component path -> ${u.green(componentPath)}`);
                                                if (listObject &&
                                                    component.get('listObject') !== ref) {
                                                    console.log(`Setting ${ref} `);
                                                    component.set('listObject', ref);
                                                    (0, set_1.default)(pageContext, listObjectPath, ref);
                                                }
                                            }
                                            yield _emitHook('sourceNodes', c.sourceNodesHook.componentsGenerated, {
                                                assetsUrl: nui.getAssetsUrl(),
                                                baseUrl: nui.getBaseUrl(),
                                                createActionChain: nui.createActionChain,
                                                createPage: nui.createPage,
                                                createPlugin: nui.createPlugin,
                                                createSrc: nui.createSrc,
                                                emit: nui.emit,
                                                getPlugins: nui.getPlugins,
                                                getPreloadPages: nui.getPreloadPages,
                                                getPages: nui.getPages,
                                                getRoot: nui.getRoot,
                                                pageName,
                                                removeComponent: nui.removeComponent,
                                                resolveComponents: nui.resolveComponents,
                                            });
                                        }
                                        else {
                                            _reporter === null || _reporter === void 0 ? void 0 : _reporter.success(`Reusing cached components for ${pageName}`);
                                        }
                                        let serializedPage = '';
                                        try {
                                            serializedPage = JSON.stringify(_cache.root[pageName]);
                                        }
                                        catch (error) {
                                            serializedPage = JSON.stringify({});
                                        }
                                        /**
                                         * Create the GraphQL nodes for page objects
                                         * These will be merged and eventually form the noodl root object that wraps our react app so they can be available to page routes to work with
                                         */
                                        yield createNode({
                                            name: pageName,
                                            slug: `/${pageName}/index.html`,
                                            id: createNodeId(pageName),
                                            content: serializedPage,
                                            children: [],
                                            parent: null,
                                            internal: {
                                                content: serializedPage,
                                                contentDigest: createContentDigest(serializedPage),
                                                type: c.noodlPageNodeType,
                                            },
                                        });
                                    }
                                    catch (error) {
                                        throw error instanceof Error
                                            ? error
                                            : new Error(String(error));
                                    }
                                }) }, [
                                ['patching', c.sourceNodesHook.patchingEventListener],
                                ['patched', c.sourceNodesHook.patchedEventListener],
                            ].reduce((acc, [type, constKey]) => {
                                acc[type] = [
                                    'addEventListener',
                                    'removeEventListener',
                                ].reduce((acc, evt) => u.assign(acc, {
                                    [evt]: (...args) => _emitHook('sourceNodes', constKey, evt, ...args),
                                }), {});
                                return acc;
                            }, {})),
                        });
                    });
                });
                // END rehydration
                yield _emitHook('sourceNodes', c.sourceNodesHook.cacheDirectory, gatsbyCache.directory);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                yield _emitHook('sourceNodes', c.sourceNodesHook.exit);
                throw err;
            }
        }
        yield _emitHook('sourceNodes', c.sourceNodesHook.exit);
    }));
    const createPages = _handlers.createLifeCycleHandler('createPages', ({ actions: { createPage }, graphql }, __, { meta }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _a;
        yield _emitHook('createPages', c.createPagesHook.enter);
        if (!_initiatedCreatePages) {
            _initiatedCreatePages = true;
            try {
                /**
                 * Query the created GraphQL nodes from app pages
                 */
                const { data: { allNoodlPage } = {}, errors } = yield graphql(`
            {
              allNoodlPage {
                nodes {
                  name
                  content
                  slug
                }
              }
            }
          `);
                if (errors) {
                    throw new Error(errors);
                }
                else {
                    yield _emitHook('createPages', c.createPagesHook.pageNodes, allNoodlPage);
                    const assetsUrl = loader.config.resolve(loader.cadlEndpoint.assetsUrl);
                    const baseUrl = loader.config.resolve(loader.config.baseUrl);
                    /**
                     * Creates the page route
                     *
                     * "context" will be available in the NoodlPageTemplate component as props.pageContext (to ensure we only have the data we care about, we only pick "components" from the page object only.
                     *
                     * The rest of the page object props (init, etc) are placed on the root noodl object instead)
                     */
                    for (const rootKey of _cache.rootKeys) {
                        if (rootKey in _cache.contexts) {
                            // Becomes the page route
                            const slug = ((_a = _cache.contexts[rootKey]) === null || _a === void 0 ? void 0 : _a.slug) || `/${rootKey}/index.html`;
                            yield _emitHook('createPages', c.createPagesHook.creatingPageRoute, {
                                context: _cache.contexts[rootKey],
                                slug,
                                templatePath: meta.get('paths.template'),
                            });
                            createPage({
                                path: slug,
                                component: meta.get('paths.template'),
                                context: Object.assign(Object.assign({}, _cache.contexts[rootKey]), { assetsUrl,
                                    baseUrl }),
                            });
                            yield _emitHook('createPages', c.createPagesHook.createdPageRoute, {
                                context: _cache.contexts[rootKey],
                                slug,
                                templatePath: meta.get('paths.template'),
                            });
                        }
                    }
                }
            }
            catch (error) {
                throw error instanceof Error ? error : new Error(String(error));
            }
            yield _cache.save();
        }
        yield _emitHook('createPages', c.createPagesHook.exit);
    }));
    const onCreatePage = _handlers.createLifeCycleHandler('onCreatePage', ({ actions: { createPage, deletePage }, page }, __, { loader, meta }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _b;
        const assetsUrl = loader.config.resolve(loader.cadlEndpoint.assetsUrl);
        const baseUrl = loader.config.resolve(loader.config.baseUrl);
        // Binds homepage to startPage
        if (page.path === '/') {
            const oldPage = u.assign({}, page);
            const pageName = meta.get('startPage') || '';
            page.context = Object.assign(Object.assign({}, _cache.contexts[pageName]), { assetsUrl,
                baseUrl });
            deletePage(oldPage);
            createPage(page);
            yield _emitHook('onCreatePage', c.onCreatePageHook.boundHomePage, {
                assetsUrl,
                baseUrl,
                page,
                pageName,
                pageContext: page.context,
                slug: ((_b = _cache.contexts[pageName]) === null || _b === void 0 ? void 0 : _b.slug) || `/${pageName}/index.html`,
            });
        }
    }));
    const createSchemaCustomization = _handlers.createLifeCycleHandler('createSchemaCustomization', (_) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { createTypes, schema } = _;
        yield _emitHook('createSchemaCustomization', c.createSchemaCustomizationHook.enter);
        const schemaTypeOptions = {
            name: 'NoodlPage',
            fields: {
                name: 'String',
                content: 'String',
                slug: 'String',
            },
            interfaces: ['Node'],
        };
        if (u.isFnc(createTypes)) {
            yield _emitHook('createSchemaCustomization', c.createSchemaCustomizationHook.creatingGraphQLObjectType, schemaTypeOptions);
            const graphQLObjectType = schema.buildObjectType(schemaTypeOptions);
            createTypes([graphQLObjectType]);
            yield _emitHook('createSchemaCustomization', c.createSchemaCustomizationHook.createdGraphQLObjectType, graphQLObjectType);
        }
        yield _emitHook('createSchemaCustomization', c.createSchemaCustomizationHook.exit);
    }));
    const createWebpackConfig = _handlers.createLifeCycleHandler('createWebpackConfig', ({ actions: { setWebpackConfig } }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield _emitHook('createWebpackConfig', c.createWebpackConfigHook.enter);
        setWebpackConfig({
            plugins: [
                new webpack_1.IgnorePlugin({
                    contextRegExp: /canvas|pnpapi|jsdom$/,
                    resourceRegExp: /canvas|pnpapi|jsdom$/,
                }),
            ],
        });
        yield _emitHook('createWebpackConfig', c.createWebpackConfigHook.exit);
    }));
    return {
        // onPreInit,
        onPluginInit,
        sourceNodes,
        createPages,
        onCreatePage,
        createSchemaCustomization,
        createWebpackConfig,
        setCurrentWorkingDirectory(cwd) {
            loader.setCurrentWorkingDirectory(cwd);
        },
    };
}
exports.createGatsbyNodeWrapper = createGatsbyNodeWrapper;
//# sourceMappingURL=gatsby-node-wrapper.js.map