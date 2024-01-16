import type {Align} from './lib/infer.js'

export {gfmTableHtml} from './lib/html.js'
export {gfmTable} from './lib/syntax.js'

declare module 'micromark-util-types' {
  interface Token {
    _align?: Align[]
  }

  interface TokenTypeMap {
    table: 'table'
    tableBody: 'tableBody'
    tableCellDivider: 'tableCellDivider'
    tableContent: 'tableContent'
    tableData: 'tableData'
    tableDelimiter: 'tableDelimiter'
    tableDelimiterFiller: 'tableDelimiterFiller'
    tableDelimiterMarker: 'tableDelimiterMarker'
    tableDelimiterRow: 'tableDelimiterRow'
    tableHead: 'tableHead'
    tableHeader: 'tableHeader'
    tableRow: 'tableRow'
  }

  interface CompileData {
    tableAlign?: Align[]
    tableColumn?: number
  }
}
