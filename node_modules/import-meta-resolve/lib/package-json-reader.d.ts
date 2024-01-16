export default reader;
export type ErrnoException = import('./errors.js').ErrnoException;
export type PackageType = 'commonjs' | 'module' | 'none';
export type PackageConfig = {
    pjsonPath: string;
    exists: boolean;
    main: string | undefined;
    name: string | undefined;
    type: PackageType;
    exports: Record<string, unknown> | undefined;
    imports: Record<string, unknown> | undefined;
};
declare namespace reader {
    export { read };
}
/**
 * @param {string} jsonPath
 * @param {{specifier: URL | string, base?: URL}} options
 * @returns {PackageConfig}
 */
declare function read(jsonPath: string, { base, specifier }: {
    specifier: URL | string;
    base?: URL;
}): PackageConfig;
