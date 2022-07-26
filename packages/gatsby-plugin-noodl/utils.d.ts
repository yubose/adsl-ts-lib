import type { Logger } from 'winston';
declare function downloadFile(log: Logger, url: string, filename: string, dir: string): Promise<any>;
declare function getConfigUrl(configKey?: string): string;
declare function configDirExists(baseDir: string | null, configKey: string): boolean;
declare function ensureExt(value?: string, ext?: string): string;
declare function fetchYml(url?: string): Promise<any>;
declare function removeExt(str: string, ext?: string): string;
declare function getAssetFilePath(srcPath: string, filename: string): string;
declare function getConfigDir(configKey: string, cwd?: string): string;
declare const utils: {
    configDirExists: typeof configDirExists;
    downloadFile: typeof downloadFile;
    ensureExt: typeof ensureExt;
    fetchYml: typeof fetchYml;
    getAssetFilePath: typeof getAssetFilePath;
    getConfigDir: typeof getConfigDir;
    getConfigUrl: typeof getConfigUrl;
    getConfigVersion: (config: any, env?: string) => any;
    normalizePath: (s: string) => string;
    removeExt: typeof removeExt;
    regex: {
        cadlBaseUrlPlaceholder: RegExp;
        cadlVersionPlaceholder: RegExp;
        designSuffixPlaceholder: RegExp;
    };
};
export default utils;
