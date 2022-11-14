"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCache = void 0;
const tslib_1 = require("tslib");
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const path_1 = tslib_1.__importDefault(require("path"));
const noodl_loader_1 = require("noodl-loader");
function createCache({ appKey = '', configKey = '', config = new noodl_loader_1.Config(), cadlEndpoint = new noodl_loader_1.CadlEndpoint(), dir, on = {}, } = {}) {
    let _contexts = {};
    // Not used atm
    // let _metadata = {} as {
    //   appKey: string
    //   assetsUrl: string
    //   baseUrl: string
    //   configKey: string
    //   timestamp: number
    //   version: string | number
    // }
    let _root = {};
    if (!dir) {
        throw new Error(`"dir" is required`);
    }
    let _basePath = dir;
    let _rootPath = path_1.default.join(_basePath, 'root.json');
    let _contextsPath = path_1.default.join(_basePath, 'contexts.json');
    // let _metaPath = path.join(_basePath, 'metadata.json')
    const o = {
        get contexts() {
            return _contexts;
        },
        directory: _basePath,
        get root() {
            return _root;
        },
        get rootKeys() {
            return Object.keys(_root);
        },
        save() {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    yield Promise.all([
                        ['root', _root, _rootPath],
                        ['contexts', _contexts, _contextsPath],
                    ].map(([type, data, filepath]) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        var _a;
                        try {
                            yield fs_extra_1.default.writeJson(filepath, data);
                            (_a = on.save) === null || _a === void 0 ? void 0 : _a.call(on, type, data, filepath);
                        }
                        catch (error) {
                            const err = error instanceof Error ? error : new Error(String(error));
                            throw err;
                        }
                    })));
                }
                catch (error) {
                    throw error instanceof Error ? error : new Error(String(error));
                }
            });
        },
    };
    fs_extra_1.default.ensureDirSync(_basePath);
    if (!fs_extra_1.default.existsSync(_rootPath))
        fs_extra_1.default.writeJsonSync(_rootPath, {});
    _root = fs_extra_1.default.readJsonSync(_rootPath);
    if (!fs_extra_1.default.existsSync(_contextsPath))
        fs_extra_1.default.writeJsonSync(_contextsPath, {});
    _contexts = fs_extra_1.default.readJsonSync(_contextsPath);
    // if (!fs.existsSync(_metaPath)) fs.writeJsonSync(_metaPath, {})
    // _metadata = fs.readJsonSync(_metaPath)
    return o;
}
exports.createCache = createCache;
//# sourceMappingURL=cache.js.map