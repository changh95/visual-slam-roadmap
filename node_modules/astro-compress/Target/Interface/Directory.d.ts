/// <reference types="node" />
/**
 * @module Directory
 *
 */
export default interface Type {
    (Path: string): Promise<ParsedPath["dir"]>;
}
import type { ParsedPath } from "path";
