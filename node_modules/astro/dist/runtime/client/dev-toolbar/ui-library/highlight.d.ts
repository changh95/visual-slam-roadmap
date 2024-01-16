import { type Icon } from './icons.js';
export declare class DevToolbarHighlight extends HTMLElement {
    icon?: Icon | undefined | null;
    shadowRoot: ShadowRoot;
    constructor();
    connectedCallback(): void;
}
