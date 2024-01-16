export {gfmAutolinkLiteral} from './lib/syntax.js'
export {gfmAutolinkLiteralHtml} from './lib/html.js'

declare module 'micromark-util-types' {
  interface Token {
    _gfmAutolinkLiteralWalkedInto?: boolean
  }

  interface TokenTypeMap {
    literalAutolink: 'literalAutolink'
    literalAutolinkEmail: 'literalAutolinkEmail'
    literalAutolinkHttp: 'literalAutolinkHttp'
    literalAutolinkWww: 'literalAutolinkWww'
  }
}
