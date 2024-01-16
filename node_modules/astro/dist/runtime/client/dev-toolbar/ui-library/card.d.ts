export declare class DevToolbarCard extends HTMLElement {
    link?: string | undefined | null;
    clickAction?: () => void | (() => Promise<void>);
    shadowRoot: ShadowRoot;
    constructor();
    connectedCallback(): void;
}
