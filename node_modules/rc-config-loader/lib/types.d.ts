export declare type ExtensionName = ".cjs" | ".js" | ".json" | ".yaml" | ".yml";
export declare type RequiredOption = "packageJSON" | "defaultExtension" | "cwd";
export declare type Loader = <R extends {}>(fileName: string, supperes: boolean) => R;
export declare type ExtensionLoaderMap = Record<ExtensionName, Loader>;
export declare type PossibleUndefined<T> = T | undefined;
export interface rcConfigResult<R extends Record<string, unknown>> {
    config: R;
    filePath: string;
}
export interface rcConfigLoaderOption {
    /** does look for `package.json` */
    packageJSON?: boolean | {
        fieldName: string;
    };
    /** if config file name is not same with packageName, set the name */
    configFileName?: string;
    /** treat default(no ext file) as some extension */
    defaultExtension?: ExtensionName | ExtensionName[];
    /** where start to load */
    cwd?: string;
}
