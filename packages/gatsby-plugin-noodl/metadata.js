"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMetadata = void 0;
const tslib_1 = require("tslib");
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
const set_1 = tslib_1.__importDefault(require("lodash/set"));
const path_1 = tslib_1.__importDefault(require("path"));
const utils_1 = tslib_1.__importDefault(require("./utils"));
function createMetadata({ loader }) {
    let _currentContext = 'none';
    let _timeline = new Set();
    let _store = new Map();
    function _createTimelineEntry(op, value, key) {
        const item = Object.assign({ type: op, at: Date.now(), context: _currentContext, value }, (key ? { key } : undefined));
        _timeline.add(item);
        return item;
    }
    function _set(key, value) {
        if (key === 'appKey')
            loader.setAppKey(value);
        else if (key === 'configKey')
            loader.setConfigKey(value);
        else if (key === 'cwd')
            loader.setCurrentWorkingDirectory(value);
        else if (key === 'languageSuffix')
            loader.setFileLanguageSuffix(value);
        if (u.isStr(key)) {
            if (key.startsWith('paths')) {
                if (u.isStr(value))
                    _store.set(key, path_1.default.resolve(u.unixify(value)));
            }
            else {
                _store.set(key, value);
            }
            _createTimelineEntry('set', value, key);
        }
        return o;
    }
    const o = {
        [Symbol.for('nodejs.util.inspect.custom')]() {
            return this.toJSON();
        },
        clear() {
            _store.clear();
            return o;
        },
        get(key) {
            const value = key === 'appKey'
                ? loader.appKey
                : key === 'configKey'
                    ? loader.configKey
                    : _store.get(key);
            _createTimelineEntry('get', value);
            return value;
        },
        getAppDirectory() {
            return utils_1.default.getConfigDir(loader.configKey, _store.get('cwd'));
        },
        getAssetsDirectory() {
            return utils_1.default.resolvePaths(o.getAppDirectory(), 'assets');
        },
        getConfigFileName() {
            return utils_1.default.ensureExt(loader.configKey, 'yml') || '';
        },
        getConfigUrl() {
            return loader.createURL('config');
        },
        getConfigPath() {
            return utils_1.default.resolvePaths(o.getAppDirectory(), o.getConfigFileName());
        },
        getCurrentWorkingDirectory() {
            return loader.getCurrentWorkingDirectory();
        },
        getOutputDirectory() {
            return _store.get('paths.output');
        },
        set: _set,
        setContext(context) {
            _currentContext = context;
            return o;
        },
        setOrCreate(key, value) {
            if (!_store.has(key)) {
                // const
            }
            else {
                const val = _store.get(key);
                if (u.isArr(val) || u.isObj(val)) {
                    (0, set_1.default)(val, key, value);
                    _createTimelineEntry('set', value, key);
                }
                // _store.set()
            }
        },
        remove(key) {
            _store.delete(key);
            return o;
        },
        toJSON() {
            const metadata = {
                appKey: o.get('appKey'),
                cacheDirectory: o.get('cacheDirectory'),
                cwd: o.get('cwd'),
                configKey: o.get('configKey'),
                configUrl: o.getConfigUrl(),
                deviceType: o.get('deviceType'),
                ecosEnv: o.get('ecosEnv'),
                existingFilesInAppDirectory: o.get('existingFilesInAppDirectory'),
                extractedAssets: o.get('extractedAssets'),
                loader: o.get('loader'),
                loglevel: o.get('loglevel'),
                paths: o.get('paths'),
                fetched: o.get('fetched'),
                timeline: _timeline,
                sdk: o.get('sdk'),
                viewport: o.get('viewport'),
            };
            return metadata;
        },
        toString(minify = false) {
            const args = (minify ? [] : [null, 2]);
            return JSON.stringify(this.toJSON(), ...args);
        },
    };
    return o;
}
exports.createMetadata = createMetadata;
//# sourceMappingURL=metadata.js.map