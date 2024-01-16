import type { AstroMarkdownOptions, MarkdownProcessor } from './types.js';
export { InvalidAstroDataError, setVfileFrontmatter } from './frontmatter-injection.js';
export { rehypeHeadingIds } from './rehype-collect-headings.js';
export { remarkCollectImages } from './remark-collect-images.js';
export { remarkPrism } from './remark-prism.js';
export { remarkShiki } from './remark-shiki.js';
export { createShikiHighlighter, replaceCssVariables, type ShikiHighlighter } from './shiki.js';
export * from './types.js';
export declare const markdownConfigDefaults: Required<AstroMarkdownOptions>;
/**
 * Create a markdown preprocessor to render multiple markdown files
 */
export declare function createMarkdownProcessor(opts?: AstroMarkdownOptions): Promise<MarkdownProcessor>;
