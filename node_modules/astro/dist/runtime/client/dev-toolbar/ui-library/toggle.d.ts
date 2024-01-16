export declare class DevToolbarToggle extends HTMLElement {
    shadowRoot: ShadowRoot;
    input: HTMLInputElement;
    constructor();
    connectedCallback(): void;
    get value(): string;
    set value(val: string);
}
