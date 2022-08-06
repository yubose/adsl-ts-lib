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
export declare class Metadata {
    #private;
    clear(): this;
    get(key: string): any;
    set(key: string, value: any): this;
    setOrCreate(key: string, value: any): void;
    remove(key: string): this;
    toJSON(): {
        appKey: string;
        cacheDirectory: any;
        cwd: any;
        configKey: any;
        configUrl: any;
        deviceType: any;
        ecosEnv: any;
        existingFilesInAppDirectory: string[];
        extractedAssets: string[];
        loader: {
            appConfigUrl?: string | undefined;
            options?: {
                config?: string | undefined;
                dataType?: "object" | "map" | undefined;
                deviceType?: string | undefined;
                env?: string | undefined;
                loglevel?: string | undefined;
                version?: string | undefined;
            } | undefined;
            loadRootConfigOptions?: {
                dir?: string | undefined;
                config?: string | undefined;
            } | undefined;
            loadAppConfigOptions?: {
                dir?: string | undefined;
                fallback?: {
                    type?: "download" | undefined;
                    appConfigUrl?: string | undefined;
                    appDir?: string | undefined;
                    filename?: string | undefined;
                } | undefined;
            } | undefined;
        };
        loglevel: "error" | "debug" | "info" | "silent" | "trace" | "warn" | undefined;
        paths: {
            output?: string | undefined;
            src?: string | undefined;
            template?: string | undefined;
        } & {
            app?: {
                assetsDir?: string | undefined;
                cadlEndpoint?: string | undefined;
                config?: string | undefined;
                dir?: string | undefined;
                pages?: {
                    [pageName: string]: {
                        dir?: string | undefined;
                        components?: string | undefined;
                        context?: string | undefined;
                    };
                } | undefined;
            } | undefined;
        };
        fetched: string[];
        sdk: {
            assetsUrl?: string | undefined;
            baseUrl?: string | undefined;
            cadlEndpoint?: Record<string, any> | undefined;
        };
        viewport: {
            width: number;
            height: number;
        };
    } & Record<string, any>;
    toString(minify?: boolean): string;
}
export default utils;
