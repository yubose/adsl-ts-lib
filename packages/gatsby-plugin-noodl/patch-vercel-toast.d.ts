import type { PackageJson } from 'type-fest';
import type { Reporter } from 'gatsby';
export declare function transformExports(obj: Record<string, any>, { on, }?: {
    on?: {
        replace?: (prevValue: string, newValue: string) => void;
    };
}): {
    [key: string]: any;
};
export declare function patchVercelToast(reporter: Reporter, cwd?: string, on?: {
    directoryFound?: (directory: string, filepath: string, pkgJson: PackageJson) => void;
}): Promise<void>;
