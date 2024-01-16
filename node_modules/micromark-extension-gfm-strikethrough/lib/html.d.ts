/**
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */
/**
 * Create an HTML extension for `micromark` to support GFM strikethrough when
 * serializing to HTML.
 *
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions`, to
 *   support GFM strikethrough when serializing to HTML.
 */
export function gfmStrikethroughHtml(): HtmlExtension
export type HtmlExtension = import('micromark-util-types').HtmlExtension
