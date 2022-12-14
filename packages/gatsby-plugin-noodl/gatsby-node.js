"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSchemaCustomization = exports.onCreatePage = exports.createPages = exports.sourceNodes = exports.onPluginInit = exports.onPreInit = exports.reset = exports.dumpMetadata = exports.paths = void 0;
const tslib_1 = require("tslib");
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
const noodl_ui_1 = require("noodl-ui");
const loglevel_1 = tslib_1.__importDefault(require("loglevel"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const nt = tslib_1.__importStar(require("noodl-types"));
const get_1 = tslib_1.__importDefault(require("lodash/get"));
const set_1 = tslib_1.__importDefault(require("lodash/set"));
const path_1 = tslib_1.__importDefault(require("path"));
const noodl_1 = require("noodl");
const y = tslib_1.__importStar(require("yaml"));
const utils_1 = tslib_1.__importStar(require("./utils"));
const DEFAULT_CONFIG = 'aitmed';
const DEFAULT_DEVICE_TYPE = 'web';
const DEFAULT_ECOS_ENV = 'stable';
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_OUTPUT_PATH = 'output';
const DEFAULT_SRC_PATH = './src';
const DEFAULT_TEMPLATE_PATH = path_1.default.join(DEFAULT_SRC_PATH, 'templates/page.tsx');
const DEFAULT_VIEWPORT_WIDTH = 1024;
const DEFAULT_VIEWPORT_HEIGHT = 768;
const NOODL_PAGE_NODE_TYPE = 'NoodlPage';
loglevel_1.default.setDefaultLevel(DEFAULT_LOG_LEVEL);
const BASE_CONFIG_URL = `https://public.aitmed.com/config/`;
const LOGLEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];
const { cyan, yellow, red, newline } = u;
const { debug, info, warn } = loglevel_1.default;
let _sdkCache;
let _meta = new utils_1.Metadata();
let _loader;
let _appKey = '';
let _assetsUrl = '';
let _baseUrl = '';
let _cacheDir = '';
let _cwd = '';
let _configKey = '';
let _configUrl = '';
let _deviceType = '';
let _loglevel = DEFAULT_LOG_LEVEL;
let _ecosEnv = '';
let _startPage = '';
let _viewport = {
    width: DEFAULT_VIEWPORT_WIDTH,
    height: DEFAULT_VIEWPORT_HEIGHT,
};
let _pages = {
    json: {},
    serialized: {},
};
let _paths = {
    output: '',
    src: '',
    template: '',
};
exports.paths = _paths;
const _savedAssets = [];
const _loggedAssets = [];
const _preloadKeys = [];
const _pageKeys = [];
let _cacheFiles = {};
let _context_ = {};
let _dump = { paths: {} };
let _missingFiles = {
    assets: {},
    pages: {},
};
let resolvedAssetsDir = '';
let resolvedConfigsDir = '';
let resolvedAppConfigFile = '';
let resolvedOutputNamespacedWithConfig = '';
const insertFetchedToMeta = (url) => {
    const currentFetchedURLs = _meta.get('fetched') || [];
    if (!currentFetchedURLs.includes(url)) {
        currentFetchedURLs.push(url);
        _meta.set('fetched', currentFetchedURLs);
    }
};
const withoutCwd = (s) => {
    if (u.isObj(s)) {
        return u
            .entries(s)
            .reduce((acc, [k, v]) => u.assign(acc, { [k]: withoutCwd(v) }), {});
    }
    const str = String(s);
    const indexPkgs = str.indexOf('/packages/');
    if (indexPkgs > -1)
        return str.substring(indexPkgs);
    return s;
};
const getPageRefs = (pageName) => { var _a; return ((_a = _sdkCache === null || _sdkCache === void 0 ? void 0 : _sdkCache.refs) === null || _a === void 0 ? void 0 : _a[pageName]) || {}; };
/**
 * @param { opts:{ paths?: any } } args
 * @returns { Promise<import('./types').DumpedMetadata> }
 */
const dumpMetadata = (_a = {}) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var { paths: pathsProp, write = true } = _a, other = tslib_1.__rest(_a, ["paths", "write"]);
    const metadata = withoutCwd(Object.assign(Object.assign({ appKey: _appKey, assetsUrl: _assetsUrl, baseUrl: _baseUrl, cacheDir: _cacheDir, configKey: _configKey, configUrl: _configUrl, deviceType: _deviceType, ecosEnv: _ecosEnv, loglevel: _loglevel, startPage: _startPage, missingFiles: _missingFiles }, other), { paths: Object.assign({ cacheDir: _cacheDir, cacheFiles: _cacheFiles, cwd: _cwd, output: _paths.output, resolvedAssetsDir: resolvedAssetsDir, resolvedConfigsDir: resolvedConfigsDir, resolvedAppConfigFile: resolvedAppConfigFile, resolvedOutputNamespacedWithConfig: resolvedOutputNamespacedWithConfig, src: _paths.src, template: _paths.template }, pathsProp), timestamp: new Date().toLocaleString(), viewport: {
            width: _viewport === null || _viewport === void 0 ? void 0 : _viewport.width,
            height: _viewport === null || _viewport === void 0 ? void 0 : _viewport.height,
        } }));
    if (write) {
        const filepath = u.unixify(path_1.default.join(_paths.output, './metadata.json'));
        loglevel_1.default.debug(`Writing to: ${u.yellow(filepath)}`);
        yield fs_extra_1.default.writeJson(filepath, metadata, { spaces: 2 });
    }
    return metadata;
});
exports.dumpMetadata = dumpMetadata;
const reset = () => {
    _appKey = '';
    _assetsUrl = '';
    _baseUrl = '';
    _cacheDir = '';
    _cwd = '';
    _configKey = '';
    _configUrl = '';
    _deviceType = '';
    _loglevel = DEFAULT_LOG_LEVEL;
    _ecosEnv = '';
    _startPage = '';
    _viewport = { width: DEFAULT_VIEWPORT_WIDTH, height: DEFAULT_VIEWPORT_HEIGHT };
    _pages = { json: {}, serialized: {} };
    _paths = { output: '', src: '', template: '' };
    _savedAssets.length = 0;
    _loggedAssets.length = 0;
    _preloadKeys.length = 0;
    _pageKeys.length = 0;
    _context_ = {};
    _dump = { paths: {} };
    _missingFiles = { assets: {}, pages: {} };
    _cacheFiles = {};
    resolvedAssetsDir = '';
    resolvedConfigsDir = '';
    resolvedAppConfigFile = '';
    resolvedOutputNamespacedWithConfig = '';
};
exports.reset = reset;
//
/**
 * https://www.gatsbyjs.com/docs/node-apis/
 */
const onPreInit = (_, pluginOpts) => {
    _.reporter.setVerbose(true);
    newline();
    const loglevel = pluginOpts === null || pluginOpts === void 0 ? void 0 : pluginOpts.loglevel;
    if (loglevel &&
        loglevel !== DEFAULT_LOG_LEVEL &&
        LOGLEVELS.includes(loglevel)) {
        loglevel_1.default.setLevel(loglevel);
        _dump.loglevel = loglevel;
        _meta.set('loglevel', loglevel);
    }
    if (pluginOpts.metadata && pluginOpts.metadata instanceof utils_1.Metadata) {
        _meta = pluginOpts.metadata;
    }
    for (const key of u.keys(_paths)) {
        if (pluginOpts[key]) {
            pluginOpts[key] = u.unixify(pluginOpts[key]);
            _dump.paths[key] = u.unixify(_dump.paths[key]);
        }
    }
};
exports.onPreInit = onPreInit;
const onPluginInit = function onPluginInit(args, pluginOpts = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        _paths.output = ((_a = pluginOpts.paths) === null || _a === void 0 ? void 0 : _a.output) || DEFAULT_OUTPUT_PATH;
        _paths.src = ((_b = pluginOpts.paths) === null || _b === void 0 ? void 0 : _b.src) || DEFAULT_SRC_PATH;
        _paths.template = require.resolve(((_c = pluginOpts.paths) === null || _c === void 0 ? void 0 : _c.template) || DEFAULT_TEMPLATE_PATH);
        _meta.set('paths', Object.assign(Object.assign({}, _meta.get('paths')), { output: ((_d = pluginOpts.paths) === null || _d === void 0 ? void 0 : _d.output) || DEFAULT_OUTPUT_PATH, src: ((_e = pluginOpts.paths) === null || _e === void 0 ? void 0 : _e.src) || DEFAULT_SRC_PATH, template: require.resolve(((_f = pluginOpts.paths) === null || _f === void 0 ? void 0 : _f.template) || DEFAULT_TEMPLATE_PATH) }));
        _meta.set('cacheDirectory', args.cache.directory);
        _meta.set('cwd', pluginOpts.cwd || process.cwd());
        _meta.set('configKey', pluginOpts.config || DEFAULT_CONFIG);
        _meta.set('configUrl', utils_1.default.ensureExt(`${BASE_CONFIG_URL}${_configKey}`, 'yml'));
        _meta.set('deviceType', pluginOpts.deviceType || DEFAULT_DEVICE_TYPE);
        _meta.set('ecosEnv', pluginOpts.ecosEnv || DEFAULT_ECOS_ENV);
        _cacheDir = args.cache.directory;
        _cwd = pluginOpts.cwd || process.cwd();
        _configKey = pluginOpts.config || DEFAULT_CONFIG;
        _configUrl = utils_1.default.ensureExt(`${BASE_CONFIG_URL}${_configKey}`, 'yml');
        _deviceType = pluginOpts.deviceType || DEFAULT_DEVICE_TYPE;
        _ecosEnv = pluginOpts.ecosEnv || DEFAULT_ECOS_ENV;
        _loglevel = pluginOpts.loglevel || DEFAULT_LOG_LEVEL;
        debug(`Current working directory: ${yellow(_cwd)}`);
        debug(`Config key: ${yellow(_configKey)}`);
        debug(`Config url: ${yellow(_configUrl)}`);
        debug(`Device type: ${yellow(_deviceType)}`);
        debug(`Ecos environment: ${yellow(_ecosEnv)}`);
        debug(`Log level set to: ${yellow(_loglevel)}`);
        debug(`Template path: ${yellow(_paths.template)}`);
        _meta.set('paths', Object.assign(Object.assign({}, _meta.get('paths')), { app: {
                assetsDir: u.unixify(path_1.default.join(resolvedOutputNamespacedWithConfig, 'assets')),
                config: u.unixify(path_1.default.join(resolvedOutputNamespacedWithConfig, utils_1.default.ensureExt(_configKey, 'yml'))),
                dir: u.unixify(utils_1.default.getConfigDir(_configKey)),
            } }));
        resolvedOutputNamespacedWithConfig = u.unixify(utils_1.default.getConfigDir(_configKey));
        resolvedAssetsDir = u.unixify(path_1.default.join(resolvedOutputNamespacedWithConfig, 'assets'));
        resolvedConfigsDir = u.unixify(path_1.default.join(resolvedOutputNamespacedWithConfig, utils_1.default.ensureExt(_configKey, 'yml')));
        debug(`Resolved outputNamespacedWithConfig: ${yellow(resolvedOutputNamespacedWithConfig)}`);
        debug(`Resolved assetsDir: ${yellow(resolvedAssetsDir)}`);
        debug(`Resolved configFile: ${yellow(resolvedConfigsDir)}`);
        if ((_g = pluginOpts.paths) === null || _g === void 0 ? void 0 : _g.output) {
            if (!fs_extra_1.default.existsSync(_paths.output)) {
                yield fs_extra_1.default.ensureDir(_paths.output);
                debug(`Created output directory at ${yellow(_paths.output)}`);
            }
            else {
                debug(`Output path: ${yellow(_paths.output)}`);
            }
            debug(`Yaml files will be located at ${yellow(resolvedOutputNamespacedWithConfig)}`);
        }
        if (!fs_extra_1.default.existsSync(resolvedAssetsDir)) {
            yield fs_extra_1.default.ensureDir(resolvedAssetsDir);
            debug(`Created assets directory`);
        }
        debug(`Assets will be located at ${yellow(resolvedAssetsDir)}`);
        if (!fs_extra_1.default.existsSync(resolvedConfigsDir)) {
            const url = utils_1.default.getConfigUrl(_configKey);
            info(`You are missing the config file ${yellow(utils_1.default.ensureExt(_configKey))}. It will be downloaded to ${resolvedConfigsDir}`);
            debug(`Fetching config from ${yellow(url)}`);
            const yml = yield utils_1.default.fetchYml(url);
            yield fs_extra_1.default.writeFile(resolvedConfigsDir, yml);
            insertFetchedToMeta(url);
        }
        const rootConfig = y.parse(yield fs_extra_1.default.readFile(resolvedConfigsDir, 'utf8'));
        _appKey = (rootConfig === null || rootConfig === void 0 ? void 0 : rootConfig.cadlMain) || '';
        _meta.set('appKey', (rootConfig === null || rootConfig === void 0 ? void 0 : rootConfig.cadlMain) || '');
        if (!rootConfig) {
            throw new Error(`Could not load a config file both locally and remotely`);
        }
        resolvedAppConfigFile = u.unixify(path_1.default.join(resolvedOutputNamespacedWithConfig, _appKey));
        _meta.set('paths', Object.assign(Object.assign({}, _meta.get('paths')), { app: Object.assign(Object.assign({}, (_h = _meta.get('paths')) === null || _h === void 0 ? void 0 : _h.app), { cadlEndpoint: resolvedAppConfigFile }) }));
        const loaderSettings = {
            appConfigUrl: '',
            options: {
                config: _configKey,
                dataType: 'object',
                deviceType: _deviceType,
                // TODO - This option is not working
                env: _ecosEnv,
                loglevel: _loglevel || 'verbose',
                version: pluginOpts.version || 'latest',
            },
            loadRootConfigOptions: {
                dir: resolvedOutputNamespacedWithConfig,
                config: _configKey,
            },
            loadAppConfigOptions: {
                dir: '',
                fallback: {
                    type: '',
                    appConfigUrl: '',
                    appDir: '',
                    filename: '',
                },
            },
        };
        _loader = new noodl_1.Loader(loaderSettings.options);
        _loader.env = _ecosEnv;
        _meta.set('loader', loaderSettings);
        yield _loader.loadRootConfig(loaderSettings.loadRootConfigOptions);
        loaderSettings.appConfigUrl = _loader.appConfigUrl;
        debug(`Loaded root config. Loading app config using key: ${yellow(_appKey)} at ${yellow(_loader.appConfigUrl)}`);
        const appConfigYml = yield utils_1.default.fetchYml(_loader.appConfigUrl);
        _pages.json[_appKey] = y.parse(appConfigYml);
        insertFetchedToMeta(_loader.appConfigUrl);
        if (!fs_extra_1.default.existsSync(resolvedAppConfigFile)) {
            yield fs_extra_1.default.writeFile(resolvedAppConfigFile, appConfigYml, 'utf8');
            debug(`Saved app config to ${yellow(resolvedAppConfigFile)}`);
        }
        for (const key of ['preload', 'page']) {
            const _path_ = `${_appKey}.${key}`;
            if (!u.isArr((_j = _pages.json[_appKey]) === null || _j === void 0 ? void 0 : _j[key])) {
                (0, set_1.default)(_pages.json, _path_, []);
            }
            const keysList = key === 'preload' ? _preloadKeys : _pageKeys;
            keysList.push(...(0, get_1.default)(_pages.json, _path_, []));
        }
        const appConfigUrl = _loader.appConfigUrl;
        const filesDir = resolvedOutputNamespacedWithConfig;
        // TODO - Check if we still need this part
        for (const filepath of [resolvedConfigsDir, resolvedAppConfigFile]) {
            const type = filepath === resolvedConfigsDir ? 'root' : 'app';
            if (!fs_extra_1.default.existsSync(filepath)) {
                const msg = `The ${u.magenta(type)} config file at ${yellow(filepath)} does not exist`;
                loglevel_1.default.error(msg);
                process.exit(0);
            }
        }
        if (!_loader.hasInRoot(_appKey)) {
            const filename = utils_1.default.ensureExt(_appKey, 'yml');
            yield _loader.loadAppConfig({
                dir: filesDir,
                // eslint-disable-next-line
                fallback: () => utils_1.default.downloadFile(loglevel_1.default, appConfigUrl, filename, resolvedOutputNamespacedWithConfig),
            });
            loaderSettings.loadAppConfigOptions.dir = filesDir;
            loaderSettings.loadAppConfigOptions.fallback = {
                type: 'download',
                appConfigUrl,
                appDir: resolvedOutputNamespacedWithConfig,
                filename,
            };
        }
        debug(`Checking directory for page files`);
        const getPageUrl = (s) => _loader.appConfigUrl.replace('cadlEndpoint.yml', utils_1.default.ensureExt(s.includes('_en') ? s.concat('_en') : s, 'yml'));
        const regexStr = `(${_preloadKeys.concat(_pageKeys).join('|')})`;
        const filesList = yield fs_extra_1.default.readdir(filesDir);
        const expectedFilesRegex = new RegExp(regexStr);
        debug(`Constructed regular expression: ${yellow(regexStr)}`);
        _meta.set('existingFilesInAppDirectory', filesList);
        for (const filename of filesList) {
            const name = utils_1.default.removeExt(filename, 'yml');
            const filepath = path_1.default.join(filesDir, filename);
            try {
                const stat = yield fs_extra_1.default.stat(filepath);
                if (stat.isFile()) {
                    if (filename.endsWith('.yml')) {
                        if (expectedFilesRegex.test(name)) {
                            // Exists
                        }
                        else {
                            const pageUrl = getPageUrl(name);
                            debug(`Downloading missing page ${yellow(pageUrl)}`);
                            yield utils_1.default.downloadFile(loglevel_1.default, pageUrl, filename, filesDir);
                            insertFetchedToMeta(pageUrl);
                        }
                        const pageYml = (0, noodl_1.loadFile)(filepath);
                        const pageObject = y.parse(pageYml);
                        _pages.json[name] = pageObject;
                        debug(`Loaded ${yellow(name)}`);
                    }
                }
                else if (stat.isDirectory()) {
                    if (/assets/i.test(filename)) {
                        // debug(`Checking assets...`)
                    }
                }
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                loglevel_1.default.error(`Error occurring loading ${yellow(filepath)}: ${red(err.message)}`, err.stack);
            }
        }
        const loadTo_pages_ = (name, obj) => {
            _pages.json[name] = obj;
            _loader.setInRoot(name, obj);
        };
        /** @type { { pageName: string; filename: string; filepath: string }[] } */
        const appKey = utils_1.default.removeExt(rootConfig.cadlMain, 'yml');
        const allYmlPageNames = ((_m = (_l = (_k = _loader.root[appKey]) === null || _k === void 0 ? void 0 : _k.preload) === null || _l === void 0 ? void 0 : _l.concat) === null || _m === void 0 ? void 0 : _m.call(_l, (_o = _loader.root[appKey]) === null || _o === void 0 ? void 0 : _o.page)) || [];
        allYmlPageNames.forEach((name) => {
            const filename = `${name}_en.yml`;
            // const filename = `${name}.yml`
            const filepath = path_1.default.join(resolvedOutputNamespacedWithConfig, filename);
            if (!fs_extra_1.default.existsSync(filepath)) {
                _missingFiles.pages[name] = { filename, filepath, name };
            }
            else {
                loadTo_pages_(name, (0, noodl_1.loadFile)(filepath, 'json'));
            }
        });
        const baseUrl = _loader.appConfigUrl.replace('cadlEndpoint.yml', '');
        const missingPageNames = u.keys(_missingFiles.pages);
        debug(`Downloading ${yellow(missingPageNames.length)} missing pages...`);
        debug(`Using this endpoint for missing files: ${yellow(baseUrl)}`);
        yield Promise.all(missingPageNames.map((name) => {
            return new Promise((resolve) => {
                const { filename = '' } = _missingFiles.pages[name] || {};
                const url = `${baseUrl}${filename}`;
                if (nt.Identify.reference(filename))
                    return;
                if (filename.startsWith('itemObject'))
                    return;
                try {
                    const destination = path_1.default.join(resolvedOutputNamespacedWithConfig, filename);
                    debug(`Downloading ${yellow(filename)} to: ${yellow(destination)}`);
                    utils_1.default
                        .downloadFile(loglevel_1.default, url, filename, resolvedOutputNamespacedWithConfig)
                        .then((yml) => {
                        loadTo_pages_(name, y.parse(yml));
                        insertFetchedToMeta(url);
                        resolve();
                    });
                }
                catch (error) {
                    debug(error instanceof Error ? error : new Error(String(error)));
                    resolve();
                }
            });
        }));
        let assets;
        try {
            assets = yield _loader.extractAssets();
            _meta.set('extractedAssets', assets);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            loglevel_1.default.error(`[${yellow(err === null || err === void 0 ? void 0 : err.name)}] Error while extracting assets: ${red(err.message)}`);
        }
        debug(`Found ${yellow((assets === null || assets === void 0 ? void 0 : assets.length) || 0)} assets`);
        // TEMPORARY - This is here to bypass the build failing when using geolocation in lvl3
        if (!global.window)
            global.window = {};
        const win = global.window;
        if (!win.document)
            win.document = { createElement: () => ({}) };
        if (!win.location)
            win.location = { href: 'http://127.0.0.1:3000' };
        if (!win.navigator) {
            win.navigator = {
                geolocation: {
                    getCurrentPosition: () => ({
                        coords: { latitude: 0, longitude: 0, altitude: null, accuracy: 11 },
                        timestamp: Date.now(),
                    }),
                },
            };
        }
        const isAssetSaved = (filepath = '') => _savedAssets.includes(filepath);
        const isAssetLogged = (url = '') => _loggedAssets.includes(url);
        yield Promise.all((assets === null || assets === void 0 ? void 0 : assets.map((asset) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            var _p;
            const filename = `${asset.raw}`;
            const assetFilePath = path_1.default.join(resolvedAssetsDir, filename);
            if (fs_extra_1.default.existsSync(assetFilePath))
                return;
            try {
                // TODO - Redo this ugly part
                let fullDir = path_1.default.parse(assetFilePath).dir;
                if (fullDir.startsWith('https:/') && !fullDir.startsWith('https://')) {
                    fullDir = fullDir.replace('https:/', 'https://');
                }
                if (!fs_extra_1.default.existsSync(fullDir))
                    yield fs_extra_1.default.ensureDir(fullDir);
                let url = `${_loader.appConfigUrl}`.replace('cadlEndpoint.yml', '');
                url += `assets/${filename}`;
                _missingFiles.assets[filename] = {
                    url,
                    filepath: path_1.default.join(resolvedOutputNamespacedWithConfig, `assets/${filename}`),
                };
                if (!fs_extra_1.default.existsSync(assetFilePath)) {
                    if (!isAssetLogged(url)) {
                        _loggedAssets.push(url);
                        info(`Downloading ${yellow(filename)} to ${yellow(assetFilePath)}`);
                    }
                    yield utils_1.default.downloadFile(loglevel_1.default, url, filename, resolvedAssetsDir);
                    if (!isAssetSaved(assetFilePath)) {
                        _savedAssets.push(assetFilePath);
                        insertFetchedToMeta(url);
                    }
                }
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                if ('response' in err) {
                    if (((_p = err['response']) === null || _p === void 0 ? void 0 : _p['status']) === 404) {
                        const logMsg = `The asset "${asset.url}" `;
                        warn(logMsg + `returned a ${red(`404 Not Found`)} error`);
                    }
                }
                else {
                    debug(error instanceof Error ? error : new Error(String(error)));
                }
            }
        }))) || []);
    });
};
exports.onPluginInit = onPluginInit;
const sourceNodes = function sourceNodes(args, pluginOpts) {
    var _a, _b, _c, _d, _e, _f;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { cache, actions, createContentDigest, createNodeId } = args;
        const { createNode } = actions;
        const { viewport = {
            width: DEFAULT_VIEWPORT_WIDTH,
            height: DEFAULT_VIEWPORT_HEIGHT,
        }, } = pluginOpts;
        _viewport = viewport;
        _meta.set('viewport', u.pick(viewport, ['width', 'height']));
        const { cache: sdkCache, page, pages, sdk, transform, } = yield (yield Promise.resolve().then(() => tslib_1.__importStar(require('./generator')))).getGenerator({
            configKey: _configKey,
            use: {
                config: (_a = _loader === null || _loader === void 0 ? void 0 : _loader.getInRoot) === null || _a === void 0 ? void 0 : _a.call(_loader, _configKey),
                log: loglevel_1.default,
                preload: {
                    BaseCSS: (_b = _loader === null || _loader === void 0 ? void 0 : _loader.getInRoot) === null || _b === void 0 ? void 0 : _b.call(_loader, 'BaseCSS'),
                    BaseDataModel: (_c = _loader === null || _loader === void 0 ? void 0 : _loader.getInRoot) === null || _c === void 0 ? void 0 : _c.call(_loader, 'BaseDataModel'),
                    BasePage: (_d = _loader === null || _loader === void 0 ? void 0 : _loader.getInRoot) === null || _d === void 0 ? void 0 : _d.call(_loader, 'BasePage'),
                    Resource: (_e = _loader === null || _loader === void 0 ? void 0 : _loader.getInRoot) === null || _e === void 0 ? void 0 : _e.call(_loader, 'Resource'),
                },
                /**
                 * The generator will be mutating this so ensure that this reference will be stay persistent
                 */
                pages: _pages,
                viewport,
            },
        });
        _assetsUrl = sdk.assetsUrl;
        _baseUrl = sdk.baseUrl;
        _sdkCache = sdkCache;
        _startPage = (sdk.cadlEndpoint || {}).startPage;
        _meta.set('sdk', {
            assetsUrl: sdk.assetsUrl,
            baseUrl: sdk.baseUrl,
            cadlEndpoint: sdk.cadlEndpoint,
        });
        page.viewport.width = viewport.width;
        page.viewport.height = viewport.height;
        /**
         * Transform parsed json components from lvl3 to Component instances in noodl-ui so the props can be consumed in expected formats in the UI
         * @param { string } pageName
         * @param { nt.ComponentObject[] } componentObjects
         */
        function generateComponents(pageName, componentObjects) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const resolvedPageComponents = [];
                function transformAllComponents(value) {
                    return tslib_1.__awaiter(this, void 0, void 0, function* () {
                        const components = [];
                        const componentsList = u.filter(Boolean, u.array(value));
                        const numComponents = componentsList.length;
                        for (let index = 0; index < numComponents; index++) {
                            let before;
                            const transformedComponent = yield transform(componentsList[index], {
                                context: { path: [index] },
                                keepVpUnit: true,
                                on: {
                                    /** Called for every component creation (depth-first) */
                                    createComponent(comp, opts) {
                                        var _a;
                                        return tslib_1.__awaiter(this, void 0, void 0, function* () {
                                            before = u.omit(comp.toJSON(), ['children']);
                                            const { path: componentPath } = opts || {};
                                            if (!_context_[pageName])
                                                _context_[pageName] = {};
                                            if (nt.Identify.component.list(comp)) {
                                                const iteratorVar = ((_a = comp.blueprint) === null || _a === void 0 ? void 0 : _a.iteratorVar) || '';
                                                const refs = getPageRefs(pageName);
                                                const currListObjectPath = [pageName, 'components']
                                                    .concat(componentPath)
                                                    .concat('listObject')
                                                    .reduce((acc, strOrIndex, i) => {
                                                    if (u.isNum(Number(strOrIndex)) &&
                                                        !Number.isNaN(Number(strOrIndex))) {
                                                        acc += `[${strOrIndex}]`;
                                                    }
                                                    else {
                                                        acc += i === 0 ? strOrIndex : `.${strOrIndex}`;
                                                    }
                                                    return acc;
                                                }, '');
                                                const listObject = comp.get('listObject') || [];
                                                const refObject = u
                                                    .values(refs)
                                                    .find((refObj) => refObj.path === currListObjectPath);
                                                /**
                                                 * This gets passed to props.pageContext inside NoodlPageTemplate
                                                 */
                                                (0, set_1.default)(_context_, `${pageName}.lists.${comp.id}`, {
                                                    // Descendant component ids will be inserted here later
                                                    children: [],
                                                    componentPath,
                                                    id: comp.id,
                                                    iteratorVar,
                                                    listObject: (refObject === null || refObject === void 0 ? void 0 : refObject.ref) || listObject,
                                                });
                                            }
                                            // TODO - Is this still being used?
                                            else if (nt.Identify.component.image(comp)) {
                                                // const src = comp.get('path')
                                                // This is mapped to the client side to pick up the static image
                                                // comp.set(
                                                //   '_path_',
                                                //   nt.Identify.folds.emit(src)
                                                //     ? await sdk.emitCall(src.emit)
                                                //     : src,
                                                // )
                                            }
                                        });
                                    },
                                },
                            });
                            const after = transformedComponent.toJSON();
                            resolvedPageComponents.push({ before, after });
                            // Serialize the noodl-ui components before they get sent to
                            // bootstrap the server-side rendering
                            components.push(transformedComponent.toJSON());
                        }
                        return components;
                    });
                }
                const transformedComponents = yield transformAllComponents(componentObjects);
                if (pageName)
                    info(`${yellow(pageName)} Components generated`);
                return transformedComponents;
            });
        }
        const cacheDir = cache.directory;
        // const getMetaPathsObject = () =>
        //   (_meta.get('paths') || {}) as Record<string, any>
        // const metaAppPaths = getMetaPathsObject()
        /**
         * Create GraphQL nodes for app pages so they can be queried in the client side
         */
        for (const entry of u.entries(pages)) {
            const [name, pageObject] = entry;
            page.page = name;
            const pageCacheDir = path_1.default.join(cacheDir, 'generated', name);
            const cachedComponentsFilePath = path_1.default.join(pageCacheDir, 'components.json');
            const pathToCachedPageContextFile = path_1.default.join(pageCacheDir, 'context.json');
            // metaPaths.pageCacheDirectory = pageCacheDir
            // metaPaths.pageComponentsCacheDirectory = cachedComponentsFilePath
            // metaPaths.pageContextFile = pathToCachedPageContextFile
            _cacheFiles[name] = pageCacheDir;
            let components;
            let retrieveType = '';
            yield fs_extra_1.default.ensureDir(pageCacheDir);
            const cachedComponents = fs_extra_1.default.existsSync(cachedComponentsFilePath)
                ? require(cachedComponentsFilePath)
                : null;
            if (cachedComponents) {
                components = cachedComponents;
                _context_[name] = Object.assign(Object.assign({}, _context_[name]), (yield fs_extra_1.default.readJson(pathToCachedPageContextFile)));
                retrieveType = 'cache';
            }
            else {
                // cachedObject = {}
                components = u
                    .array(yield generateComponents(name, pageObject.components))
                    .filter(Boolean);
                yield fs_extra_1.default.writeJson(cachedComponentsFilePath, components);
                // await fs.writeJson(pathToCachedPageContextFile, _context_[name])
                // await cache.set(_configKey, cachedObject)
                retrieveType = 'fresh';
            }
            if (components) {
                ;
                pageObject.components = components;
            }
            else {
                loglevel_1.default.error(`Components could not be generated for page "${name}" using ${retrieveType}`);
            }
            if (!_context_[name])
                _context_[name] = {};
            if (_context_[name]) {
                ;
                _context_[name].refs = getPageRefs(name);
            }
            const lists = (_f = _context_[name]) === null || _f === void 0 ? void 0 : _f.lists;
            pageObject.components.forEach((component) => {
                (0, noodl_ui_1.publish)(component, (comp) => {
                    if (nt.Identify.component.list(comp)) {
                        const ctx = (lists === null || lists === void 0 ? void 0 : lists[comp.id]) || {};
                        if (!ctx.children)
                            ctx.children = [];
                        comp.children.forEach((child, index) => {
                            if (!ctx.children[index])
                                ctx.children[index] = [];
                            if (!ctx.children[index].includes(child.id)) {
                                ctx.children[index].push(child.id);
                            }
                            (0, noodl_ui_1.publish)(child, (c) => {
                                if (!ctx.children[index].includes(c.id)) {
                                    ctx.children[index].push(c.id);
                                }
                            });
                        });
                    }
                });
            });
            if (retrieveType === 'fresh') {
                yield fs_extra_1.default.writeJson(pathToCachedPageContextFile, _context_[name]);
            }
            _pages.serialized[name] = u.isStr(pageObject)
                ? pageObject
                : JSON.stringify(u.omit(pageObject, 'components'));
            _pages.json[name] = pageObject;
            /**
             * Create the GraphQL nodes for page objects
             * These will be merged and eventually form the noodl root object that wraps our react app so they can be available to page routes to work with
             */
            yield createNode({
                name,
                slug: `/${name}/`,
                id: createNodeId(name),
                content: _pages.serialized[name],
                children: [],
                parent: null,
                internal: {
                    content: _pages.serialized[name],
                    contentDigest: createContentDigest(_pages.serialized[name]),
                    type: NOODL_PAGE_NODE_TYPE,
                },
            });
        }
        // @ts-expect-error
        if (pluginOpts.introspection) {
            yield fs_extra_1.default.writeJson(path_1.default.join(_paths.output, `./${_configKey}_introspection.json`), pages, { spaces: 2 });
        }
        if (pluginOpts.metadata) {
            yield (0, exports.dumpMetadata)();
        }
    });
};
exports.sourceNodes = sourceNodes;
const createPages = function (args, pluginOpts) {
    var _a, _b, _c, _d, _e, _f;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const { actions, graphql } = args;
            const { createPage } = actions;
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
                const numNoodlPages = (allNoodlPage === null || allNoodlPage === void 0 ? void 0 : allNoodlPage.nodes.length) || 0;
                info(`Creating ${numNoodlPages} pages`);
                /**
                 * Creates the page route
                 *
                 * "context" will be available in the NoodlPageTemplate component as props.pageContext (to ensure we only have the data we care about, we only pick "components" from the page object only.
                 *
                 * The rest of the page object props (init, etc) are located into the root noodl object instead)
                 */
                for (const pageName of u.keys(_pages.json)) {
                    // Becomes the page route
                    const slug = `/${pageName}/index.html`;
                    createPage({
                        path: slug,
                        // NoodlPageTemplate
                        component: _paths.template,
                        context: {
                            assetsUrl: _assetsUrl,
                            baseUrl: _baseUrl,
                            lists: (_a = _context_ === null || _context_ === void 0 ? void 0 : _context_[pageName]) === null || _a === void 0 ? void 0 : _a.lists,
                            refs: getPageRefs(pageName) || {},
                            name: pageName,
                            // Intentionally leaving out other props from the page object since they are provided in the root object (available in the React context that wraps our app)
                            components: ((_c = (_b = _pages.json) === null || _b === void 0 ? void 0 : _b[pageName]) === null || _c === void 0 ? void 0 : _c['components']) ||
                                ((_f = (_e = (_d = _pages.json) === null || _d === void 0 ? void 0 : _d[pageName]) === null || _e === void 0 ? void 0 : _e['components']) === null || _f === void 0 ? void 0 : _f['components']) ||
                                [],
                            slug,
                        },
                    });
                }
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error(`[Error-createPages][${yellow(err === null || err === void 0 ? void 0 : err.name)}] ${red(err.message)}`, err.stack);
        }
    });
};
exports.createPages = createPages;
function onCreatePage(opts) {
    var _a, _b, _c, _d, _e, _f;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const { actions, page } = opts;
        const { createPage, deletePage } = actions;
        // Binds homepage to startPage
        if (page.path === '/') {
            const oldPage = u.assign({}, page);
            const pageName = _startPage;
            const slug = `/${pageName}/index.html`;
            page.context = {
                assetsUrl: _assetsUrl,
                baseUrl: _baseUrl,
                lists: (_a = ((0, get_1.default)(_context_, pageName) || {})) === null || _a === void 0 ? void 0 : _a.lists,
                refs: getPageRefs(pageName) || {},
                name: pageName,
                components: ((_c = (_b = _pages.json) === null || _b === void 0 ? void 0 : _b[pageName]) === null || _c === void 0 ? void 0 : _c.components) ||
                    ((_f = (_e = (_d = _pages.json) === null || _d === void 0 ? void 0 : _d[pageName]) === null || _e === void 0 ? void 0 : _e.components) === null || _f === void 0 ? void 0 : _f.components) ||
                    [],
                slug,
            };
            info(`Home route '${cyan('/')}' is bound to ${yellow(pageName)}`);
            deletePage(oldPage);
            createPage(page);
        }
    });
}
exports.onCreatePage = onCreatePage;
// export const onCreateWebpackConfig = ({
//   actions,
//   stage,
// }: CreateWebpackConfigArgs) => {
//   actions.setWebpackConfig({
//     plugins: [
//       new IgnorePlugin({
//         contextRegExp: /canvas|pnpapi|jsdom$/,
//         resourceRegExp: /canvas|pnpapi|jsdom$/,
//       }),
//     ],
//   })
// }
const createSchemaCustomization = ({ actions, schema, }) => {
    const { createTypes } = actions;
    createTypes([
        schema.buildObjectType({
            name: 'NoodlPage',
            fields: {
                name: 'String',
                content: 'String',
                slug: 'String',
            },
            interfaces: ['Node'],
        }),
    ]);
};
exports.createSchemaCustomization = createSchemaCustomization;
process.on('uncaughtException', (error, origin) => {
    loglevel_1.default.error(`[${u.cyan(`gatsby-plugin-noodl`)}] Uncaught exception error occurred in origin ${u.yellow(origin)}:`);
    loglevel_1.default.error(`[${u.cyan(`gatsby-plugin-noodl`)}] ${u.yellow(error.name)}: ${u.red(error.message)}`);
    process.stdout.write(JSON.stringify({ error, origin }));
});
process.on('exit', (code) => {
    // dumpMetadata()
    if (code != 0) {
        loglevel_1.default.error(`[${u.cyan(`gatsby-plugin-noodl`)}] exited with code: ${u.yellow(code)}`);
    }
});
//# sourceMappingURL=gatsby-node.js.map