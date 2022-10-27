import type { LiteralUnion } from 'type-fest';
import type { DeviceType, Env } from 'noodl-types';
import { Loader } from 'noodl-loader';
import * as t from './types';
export declare type Metadata = ReturnType<typeof createMetadata>;
export interface CreateMetadataOptions {
    loader: Loader;
}
export declare function createMetadata({ loader }: CreateMetadataOptions): {
    [x: symbol]: () => any;
    clear(): any;
    get(key: LiteralUnion<Exclude<t.Metadata.Key, t.Metadata.GetterKey>, string>): any;
    getAppDirectory(): string;
    getAssetsDirectory(): string;
    getConfigFileName(): string;
    getConfigUrl(): string;
    getConfigPath(): string;
    getCurrentWorkingDirectory(): string;
    getOutputDirectory(): any;
    set: {
        <K extends "languageSuffix">(key: K, value: LiteralUnion<'cn' | 'en' | 'es', string>): any;
        <K_1 extends "loglevel">(key: K_1, value: 'debug' | 'info' | 'warn' | 'error' | 'verbose'): any;
        <K_2 extends "appKey" | "assetsUrl" | "baseUrl" | "cacheDirectory" | "cadlBaseUrl" | "configKey" | "configUrl" | "cwd" | "paths.cache" | "paths.output" | "paths.src" | "paths.template" | "paths.app.directory" | "paths.app.config" | "rootConfigUrl" | "startPage" | "paths.app.assets">(key: K_2, value: string): any;
        <K_3 extends "cwd">(key: K_3, value: string): any;
        <K_4 extends "deviceType">(key: K_4, value: DeviceType): any;
        <K_5 extends "ecosEnv">(key: K_5, value: Env): any;
        <K_6 extends "viewport">(key: K_6, value: {
            width: number;
            height: number;
        }): any;
    };
    setContext(context: t.Metadata.Context): any;
    setOrCreate(key: string, value: any): void;
    remove(key: LiteralUnion<t.Metadata.Key, string>): any;
    toJSON(): {
        appKey: string;
        cacheDirectory: any;
        cwd: any;
        configKey: any;
        configUrl: string;
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
        loglevel: "debug" | "info" | "warn" | "error" | "trace" | "silent" | undefined;
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
        timeline: Set<t.Metadata.TimelineItem>;
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
};
