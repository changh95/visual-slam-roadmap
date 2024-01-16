import type { SSRElement } from '../../@types/astro.js';
import type { StylesheetAsset } from '../app/types.js';
export declare function createAssetLink(href: string, base?: string, assetsPrefix?: string): string;
export declare function createStylesheetElement(stylesheet: StylesheetAsset, base?: string, assetsPrefix?: string): SSRElement;
export declare function createStylesheetElementSet(stylesheets: StylesheetAsset[], base?: string, assetsPrefix?: string): Set<SSRElement>;
export declare function createModuleScriptElement(script: {
    type: 'inline' | 'external';
    value: string;
}, base?: string, assetsPrefix?: string): SSRElement;
export declare function createModuleScriptElementWithSrc(src: string, base?: string, assetsPrefix?: string): SSRElement;
export declare function createModuleScriptElementWithSrcSet(srces: string[], site?: string, assetsPrefix?: string): Set<SSRElement>;
export declare function createModuleScriptsSet(scripts: {
    type: 'inline' | 'external';
    value: string;
}[], base?: string, assetsPrefix?: string): Set<SSRElement>;
