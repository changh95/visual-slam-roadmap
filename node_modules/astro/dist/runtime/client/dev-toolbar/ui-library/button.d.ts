type ButtonSize = 'small' | 'medium' | 'large';
type ButtonStyle = 'ghost' | 'outline' | 'purple' | 'gray' | 'red';
export declare class DevToolbarButton extends HTMLElement {
    size: ButtonSize;
    buttonStyle: ButtonStyle;
    shadowRoot: ShadowRoot;
    constructor();
}
export {};
