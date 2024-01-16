import type { MarkdownHeading } from '@astrojs/markdown-remark';
import { type AstroComponentFactory } from '../runtime/server/index.js';
import type { ContentLookupMap } from './utils.js';
type LazyImport = () => Promise<any>;
type GlobResult = Record<string, LazyImport>;
type CollectionToEntryMap = Record<string, GlobResult>;
type GetEntryImport = (collection: string, lookupId: string) => Promise<LazyImport>;
export declare function defineCollection(config: any): any;
export declare function createCollectionToGlobResultMap({ globResult, contentDir, }: {
    globResult: GlobResult;
    contentDir: string;
}): CollectionToEntryMap;
export declare function createGetCollection({ contentCollectionToEntryMap, dataCollectionToEntryMap, getRenderEntryImport, }: {
    contentCollectionToEntryMap: CollectionToEntryMap;
    dataCollectionToEntryMap: CollectionToEntryMap;
    getRenderEntryImport: GetEntryImport;
}): (collection: string, filter?: ((entry: any) => unknown) | undefined) => Promise<any[] | undefined>;
export declare function createGetEntryBySlug({ getEntryImport, getRenderEntryImport, }: {
    getEntryImport: GetEntryImport;
    getRenderEntryImport: GetEntryImport;
}): (collection: string, slug: string) => Promise<{
    id: any;
    slug: any;
    body: any;
    collection: any;
    data: any;
    render(): Promise<RenderResult>;
} | undefined>;
export declare function createGetDataEntryById({ getEntryImport }: {
    getEntryImport: GetEntryImport;
}): (collection: string, id: string) => Promise<{
    id: any;
    collection: any;
    data: any;
}>;
type ContentEntryResult = {
    id: string;
    slug: string;
    body: string;
    collection: string;
    data: Record<string, any>;
    render(): Promise<RenderResult>;
};
type DataEntryResult = {
    id: string;
    collection: string;
    data: Record<string, any>;
};
type EntryLookupObject = {
    collection: string;
    id: string;
} | {
    collection: string;
    slug: string;
};
export declare function createGetEntry({ getEntryImport, getRenderEntryImport, }: {
    getEntryImport: GetEntryImport;
    getRenderEntryImport: GetEntryImport;
}): (collectionOrLookupObject: string | EntryLookupObject, _lookupId?: string) => Promise<ContentEntryResult | DataEntryResult | undefined>;
export declare function createGetEntries(getEntry: ReturnType<typeof createGetEntry>): (entries: {
    collection: string;
    id: string;
}[] | {
    collection: string;
    slug: string;
}[]) => Promise<(ContentEntryResult | DataEntryResult | undefined)[]>;
type RenderResult = {
    Content: AstroComponentFactory;
    headings: MarkdownHeading[];
    remarkPluginFrontmatter: Record<string, any>;
};
export declare function createReference({ lookupMap }: {
    lookupMap: ContentLookupMap;
}): (collection: string) => import("zod").ZodEffects<import("zod").ZodString, {
    slug: string;
    collection: string;
    id?: undefined;
} | {
    id: string;
    collection: string;
    slug?: undefined;
} | undefined, string>;
export {};
