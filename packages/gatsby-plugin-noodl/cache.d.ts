import { Config, CadlEndpoint } from 'noodl-loader';
import * as t from './types';
export interface CreateCacheHooks {
    save?: (type: 'contexts' | 'root', data: any, filepath: string) => void;
}
export interface CreateCacheOptions {
    appKey?: string;
    configKey?: string;
    config?: Config;
    cadlEndpoint?: CadlEndpoint;
    dir?: string;
    on?: CreateCacheHooks;
}
export declare function createCache({ appKey, configKey, config, cadlEndpoint, dir, on, }?: CreateCacheOptions): {
    readonly contexts: {
        [pageName: string]: t.PageContext;
    };
    directory: string;
    readonly root: {
        [rootKey: string]: any;
    };
    readonly rootKeys: string[];
    save(): Promise<void>;
};
