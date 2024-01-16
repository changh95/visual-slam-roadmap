/**
 * Create an HTML extension for `micromark` to support GitHub tables when
 * serializing to HTML.
 *
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions` to
 *   support GitHub tables when serializing to HTML.
 */
export function gfmTableHtml(): HtmlExtension
export type HtmlExtension = import('micromark-util-types').HtmlExtension
export type Align = import('./infer.js').Align
