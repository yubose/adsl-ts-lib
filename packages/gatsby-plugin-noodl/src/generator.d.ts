import type { AppConfig, RootConfig } from 'noodl-types';
import type { Logger } from 'winston';
export interface Use {
    config?: RootConfig;
    appConfig?: AppConfig;
    log?: Logger;
    preload?: Record<string, any>;
    pages?: Record<string, any>;
    viewport?: {
        width: number;
        height: number;
    };
}
/**
 * @typedef { import('noodl-ui').NuiComponent.Instance } NuiComponent
 * @typedef { import('noodl-ui').Page } NuiPage
 * @typedef { import('@babel/traverse').NodePath } NodePath
 */
export declare function getGenerator({ configKey, configUrl, ecosEnv, use, }?: {
    configKey?: string;
    configUrl?: string;
    ecosEnv?: string;
    use?: Use;
}): Promise<any>;
