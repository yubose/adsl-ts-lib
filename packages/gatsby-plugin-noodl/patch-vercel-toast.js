"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchVercelToast = exports.transformExports = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const path_1 = tslib_1.__importDefault(require("path"));
const resolve_pkg_1 = tslib_1.__importDefault(require("resolve-pkg"));
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
function transformExports(obj, { on, } = {}) {
    var _a, _b;
    if (u.isObj(obj)) {
        for (const [key, value] of u.entries(obj)) {
            if (u.isStr(value)) {
                if (value.startsWith('/')) {
                    const newValue = `.${value}`;
                    (_a = on === null || on === void 0 ? void 0 : on.replace) === null || _a === void 0 ? void 0 : _a.call(on, value, newValue);
                    obj[key] = newValue;
                }
                else if (!value.startsWith('.')) {
                    const newValue = `./${value}`;
                    (_b = on === null || on === void 0 ? void 0 : on.replace) === null || _b === void 0 ? void 0 : _b.call(on, value, newValue);
                    obj[key] = newValue;
                }
            }
            else if (u.isObj(value)) {
                transformExports(value, { on });
            }
        }
    }
    return obj;
}
exports.transformExports = transformExports;
function patchVercelToast(reporter, cwd = '../..', on) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const vercelToastDirectory = (0, resolve_pkg_1.default)('vercel-toast', { cwd });
            if (vercelToastDirectory) {
                const pkgJsonPath = path_1.default.join(vercelToastDirectory, 'package.json');
                const fileData = yield fs_1.promises.readFile(pkgJsonPath, 'utf8');
                if (fileData) {
                    const pkgJson = JSON.parse(fileData);
                    if (pkgJson) {
                        (_a = on === null || on === void 0 ? void 0 : on.directoryFound) === null || _a === void 0 ? void 0 : _a.call(on, vercelToastDirectory, pkgJsonPath, pkgJson);
                        transformExports(pkgJson.exports, {
                            on: {
                                replace: (prevValue, newValue) => {
                                    reporter.verbose(`Replacing "${u.white(prevValue)}" with ` +
                                        `"${u.cyan(newValue)}" ` +
                                        `(bugged package.json in ${pkgJsonPath})`);
                                },
                            },
                        });
                        fs_1.promises.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2), 'utf8');
                    }
                }
            }
            // console.log(resolvePkg('vercel-toast', { cwd: '../..' }))
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            reporter.error(err, err, 'gatsby-plugin-noodl');
        }
    });
}
exports.patchVercelToast = patchVercelToast;
//# sourceMappingURL=patch-vercel-toast.js.map