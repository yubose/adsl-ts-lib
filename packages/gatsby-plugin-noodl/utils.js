"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const u = tslib_1.__importStar(require("@jsmanifest/utils"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const path_1 = tslib_1.__importDefault(require("path"));
/**
 * Replaces backlashes for windows support
 */
const normalizePath = (s) => s.replace(/\\/g, '/');
const regex = {
    cadlBaseUrlPlaceholder: /\${cadlBaseUrl}/,
    cadlVersionPlaceholder: /\${cadlVersion}/,
    designSuffixPlaceholder: /\${designSuffix}/,
};
function downloadFile(log, url, filename, dir) {
    var _a;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            const destination = path_1.default.join(dir, filename);
            log.debug(`Downloading ${url} to ${destination}`);
            const { data } = yield axios_1.default.get(url, { responseType: 'text' });
            yield fs_extra_1.default.writeFile(destination, data, 'utf8');
            return data;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            // log.error(`[${u.yellow(err.name)}] ${u.red(err.message)}`)
            if ('response' in err) {
                if (((_a = err['response']) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                    log.warn(`The file "${url}" returned a ${u.red(`404 Not Found`)} error`);
                }
            }
            else {
                throw err;
            }
        }
    });
}
function getConfigUrl(configKey = 'aitmed') {
    return `https://public.aitmed.com/config/${ensureExt(configKey, 'yml')}`;
}
function configDirExists(baseDir, configKey) {
    const filepath = getConfigDir(configKey);
    console.log(`Checking if ${filepath} exists`);
    return fs_extra_1.default.existsSync(getConfigDir(configKey));
}
function ensureExt(value = '', ext = 'yml') {
    if (!u.isStr(value))
        return value;
    if (value === '')
        return `.${ext}`;
    if (value.endsWith(`.${ext}`))
        return value;
    if (value.endsWith('.'))
        return `${value}${ext}`;
    return `${value}.${ext}`;
}
function fetchYml(url = '') {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        console.log(`Fetching ${url}`);
        return axios_1.default.get(url).then((resp) => resp.data);
    });
}
function removeExt(str, ext = 'yml') {
    return path_1.default.basename(str, `.${ext}`);
}
function getAssetFilePath(srcPath, filename) {
    console.log(`Getting asset path using src "${srcPath}" and file name "${filename}"`);
    return u.unixify(path_1.default.join(srcPath, `./${filename}`));
}
function getConfigDir(configKey, cwd = process.cwd()) {
    console.log(`Getting config directory using config key "${configKey}" from cwd ${cwd}`);
    return u.unixify(path_1.default.join(cwd, 'output', removeExt(configKey, 'yml')));
}
const utils = {
    configDirExists,
    downloadFile,
    ensureExt,
    fetchYml,
    getAssetFilePath,
    getConfigDir,
    getConfigUrl,
    getConfigVersion: (config, env = 'stable') => { var _a, _b; return (_b = (_a = config === null || config === void 0 ? void 0 : config.web) === null || _a === void 0 ? void 0 : _a.cadlVersion) === null || _b === void 0 ? void 0 : _b[env]; },
    normalizePath,
    removeExt,
    regex,
};
exports.default = utils;
//# sourceMappingURL=utils.js.map