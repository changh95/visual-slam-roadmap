/**
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */
/**
 * Create an HTML extension for `micromark` to support GFM task list items when
 * serializing to HTML.
 *
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions` to
 *   support GFM task list items when serializing to HTML.
 */
export function gfmTaskListItemHtml(): HtmlExtension
export type HtmlExtension = import('micromark-util-types').HtmlExtension
