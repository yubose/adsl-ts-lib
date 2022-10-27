"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGatsbyNodeHandlers = exports.getPaths = exports.getDefaultHooks = void 0;
const tslib_1 = require("tslib");
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
const curry_1 = tslib_1.__importDefault(require("lodash/curry"));
const c = tslib_1.__importStar(require("./constants"));
function getDefaultHooks() {
    function initHooks(consts) {
        const reducer = (acc, key) => u.assign(acc, { [key]: [] });
        return u.values(consts).reduce(reducer, {});
    }
    return {
        preInit: initHooks(c.preInitHook),
        createPages: initHooks(c.createPagesHook),
        createSchemaCustomization: initHooks(c.createSchemaCustomizationHook),
        createWebpackConfig: initHooks(c.createWebpackConfigHook),
        onCreatePage: initHooks(c.onCreatePageHook),
        pluginInit: initHooks(c.pluginInitHook),
        sourceNodes: initHooks(c.sourceNodesHook),
    };
}
exports.getDefaultHooks = getDefaultHooks;
function getPaths(meta) {
    return {
        app: meta.getAppDirectory(),
        assets: meta.getAssetsDirectory(),
        cache: meta.get('paths.cache'),
        config: meta.getConfigPath(),
        cwd: meta.get('cwd'),
        output: meta.get('paths.output'),
        src: meta.get('paths.src'),
        template: meta.get('paths.template'),
    };
}
exports.getPaths = getPaths;
function getGatsbyNodeHandlers({ getHelpers, meta, setReporter, }) {
    // let _loader: Loader
    // let meta: Metadata
    // let _reporter: Reporter
    function createLifeCycleHandler(evt, fn) {
        return (0, curry_1.default)((wrappee, _, opts) => {
            if (_) {
                if (_.reporter)
                    setReporter(_.reporter);
            }
            meta.setContext(evt);
            const helpers = getHelpers(evt, opts);
            return Promise.resolve(wrappee === null || wrappee === void 0 ? void 0 : wrappee(_, opts, helpers)).then(() => fn(_, opts, helpers));
        });
    }
    function handleConfigSettings(loader, meta, arg) {
        let _host = 'public.aitmed.com';
        let _protocol = 'https';
        let _port = null;
        let _pathPrefix = '/config';
        if (u.isStr(arg)) {
            loader.setConfigKey(arg);
            meta.set('configKey', arg);
        }
        else if (arg) {
            if (arg.host)
                _host = arg.host;
            if (arg.name)
                handleConfigSettings(loader, meta, arg.name);
            if (arg.protocol)
                _protocol = arg.protocol;
            if (arg.pathPrefix)
                _pathPrefix = arg.pathPrefix;
            if (arg.port)
                _port = arg.port;
            let _rootConfigUrl = `${_protocol}://${_host}`;
            if (_port)
                _rootConfigUrl += `:${_port}`;
            _rootConfigUrl += _pathPrefix;
            loader.setRootConfigUrl(_rootConfigUrl);
        }
    }
    return {
        createLifeCycleHandler,
        handleConfigSettings,
    };
}
exports.getGatsbyNodeHandlers = getGatsbyNodeHandlers;
//# sourceMappingURL=internal.js.map