/// <reference types="node"/>
import { Transform } from 'stream';

declare namespace csvParser {
  type CsvParser = Transform;

  interface Options {
    /**
     * A single-character string used to specify the character used to escape strings in a CSV row.
     *
     * @default '"'
     */
    readonly escape?: string;

    /**
     * Specifies the headers to use. Headers define the property key for each value in a CSV row. If no `headers` option is provided, `csv-parser` will use the first line in a CSV file as the header specification.
     *
     * If `false`, specifies that the first row in a data file does _not_ contain headers, and instructs the parser to use the row index as the key for each row.
     *
     * Suppose you have a CSV file `data.csv` which contains the data:
     *
     * ```
NAME,AGE
Daffy Duck,24
Bugs Bunny,22
```
     * Using `headers: false` with the data from `data.csv` would yield:
     * ```
[
  { '0': 'Daffy Duck', '1': 24 },
  { '0': 'Bugs Bunny', '1': 22 }
]
```
     */
    readonly headers?: ReadonlyArray<string> | boolean;

    /**
     * A function that can be used to modify the values of each header. Return `null` to remove the header, and it's column, from the results.
     *
     * @example
     *
     * csv({
     *   mapHeaders: ({ header, index }) => header.toLowerCase()
     * });
     */
    readonly mapHeaders?: (args: { header: string; index: number }) => string | null;

    /**
     * A function that can be used to modify the value of each column value.
     *
     * @example
     *
     * csv({
     *   mapValues: ({ header, index, value }) => value.toLowerCase()
     * });
     */
    readonly mapValues?: (args: { header: string; index: number; value: any }) => any;

    /**
     * Specifies a single-character string to denote the end of a line in a CSV file.
     *
     * @default '\n'
     */
    readonly newline?: string;

    /**
     * Specifies a single-character string to denote a quoted string.
     *
     * @default '"'
     */
    readonly quote?: string;

    /**
     * If `true`, instructs the parser not to decode UTF-8 strings.
     */
    readonly raw?: boolean;

    /**
     * Specifies a single-character string to use as the column separator for each row.
     *
     * @default ','
     */
    readonly separator?: string;

    /**
     * Instructs the parser to ignore lines which represent comments in a CSV file. Since there is no specification that dictates what a CSV comment looks like, comments should be considered non-standard. The "most common" character used to signify a comment in a CSV file is `"#"`. If this option is set to `true`, lines which begin with `#` will be skipped. If a custom character is needed to denote a commented line, this option may be set to a string which represents the leading character(s) signifying a comment line.
     *
     * @default false
     */
    readonly skipComments?: boolean | string;

    /**
     * Specifies the number of lines at the beginning of a data file that the parser should skip over, prior to parsing headers.
     *
     * @default 0
     */
    readonly skipLines?: number;

    /**
     * Maximum number of bytes per row. An error is thrown if a line exeeds this value. The default value is on 8 peta byte.
     *
     * @default Number.MAX_SAFE_INTEGER
     */
    readonly maxRowBytes?: number;

    /**
     * If `true`, instructs the parser that the number of columns in each row must match the number of `headers` specified.
     */
    readonly strict?: boolean;
  }
}

/**
 * Streaming CSV parser that aims for maximum speed as well as compatibility with the [csv-spectrum](https://npmjs.org/csv-spectrum) CSV acid test suite.
 *
 * @param optionsOrHeaders - As an alternative to passing an `options` object, you may pass an `Array[String]` which specifies the headers to use. If you need to specify options _and_ headers, please use the the object notation with the `headers` property.
 *
 * @example
 *
 * // data.csv:
 * //
 * // NAME,AGE
 * // Daffy Duck,24
 * // Bugs Bunny,22
 *
 * import csv = require('csv-parser');
 * import * as fs from 'fs';
 *
 * const results = [];
 *
 * fs.createReadStream('data.csv')
 *   .pipe(csv())
 *   .on('data', (data) => results.push(data))
 *   .on('end', () => {
 *     console.log(results);
 *     // [
 *     //   { NAME: 'Daffy Duck', AGE: '24' },
 *     //   { NAME: 'Bugs Bunny', AGE: '22' }
 *     // ]
 *   });
 */
declare const csvParser: (
  optionsOrHeaders?: csvParser.Options | ReadonlyArray<string>
) => csvParser.CsvParser;

export = csvParser;
