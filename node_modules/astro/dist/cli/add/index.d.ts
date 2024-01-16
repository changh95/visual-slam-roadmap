import type yargs from 'yargs-parser';
interface AddOptions {
    flags: yargs.Arguments;
}
interface IntegrationInfo {
    id: string;
    packageName: string;
    dependencies: [name: string, version: string][];
    type: 'integration' | 'adapter';
}
export declare function add(names: string[], { flags }: AddOptions): Promise<void>;
export declare function validateIntegrations(integrations: string[]): Promise<IntegrationInfo[]>;
export {};
