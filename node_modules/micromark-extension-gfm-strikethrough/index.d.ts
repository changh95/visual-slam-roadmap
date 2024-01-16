export {gfmStrikethroughHtml} from './lib/html.js'
export {gfmStrikethrough, type Options} from './lib/syntax.js'

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    strikethroughSequence: 'strikethroughSequence'
    strikethroughSequenceTemporary: 'strikethroughSequenceTemporary'
    strikethrough: 'strikethrough'
    strikethroughText: 'strikethroughText'
  }
}
