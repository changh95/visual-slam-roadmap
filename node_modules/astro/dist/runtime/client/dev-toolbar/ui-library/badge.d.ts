type BadgeSize = 'small' | 'large';
type BadgeStyle = 'purple' | 'gray' | 'red' | 'green' | 'yellow';
export declare class DevToolbarBadge extends HTMLElement {
    size: BadgeSize;
    badgeStyle: BadgeStyle;
    shadowRoot: ShadowRoot;
    constructor();
}
export {};
