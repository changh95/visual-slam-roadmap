/**
 * Create an HTML extension for `micromark` to support GitHub autolink literal
 * when serializing to HTML.
 *
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions` to
 *   support GitHub autolink literal when serializing to HTML.
 */
export function gfmAutolinkLiteralHtml(): HtmlExtension
export type CompileContext = import('micromark-util-types').CompileContext
export type Handle = import('micromark-util-types').Handle
export type HtmlExtension = import('micromark-util-types').HtmlExtension
export type Token = import('micromark-util-types').Token
