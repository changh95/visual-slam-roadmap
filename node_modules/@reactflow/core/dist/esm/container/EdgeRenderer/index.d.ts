import React, { ReactNode } from 'react';
import { GraphViewProps } from '../GraphView';
import type { EdgeTypesWrapped } from '../../types';
type EdgeRendererProps = Pick<GraphViewProps, 'onEdgeClick' | 'onEdgeDoubleClick' | 'defaultMarkerColor' | 'onlyRenderVisibleElements' | 'onEdgeUpdate' | 'onEdgeContextMenu' | 'onEdgeMouseEnter' | 'onEdgeMouseMove' | 'onEdgeMouseLeave' | 'onEdgeUpdateStart' | 'onEdgeUpdateEnd' | 'edgeUpdaterRadius' | 'noPanClassName' | 'elevateEdgesOnSelect' | 'rfId' | 'disableKeyboardA11y'> & {
    edgeTypes: EdgeTypesWrapped;
    elevateEdgesOnSelect: boolean;
    children: ReactNode;
};
declare const _default: React.MemoExoticComponent<{
    ({ defaultMarkerColor, onlyRenderVisibleElements, elevateEdgesOnSelect, rfId, edgeTypes, noPanClassName, onEdgeUpdate, onEdgeContextMenu, onEdgeMouseEnter, onEdgeMouseMove, onEdgeMouseLeave, onEdgeClick, edgeUpdaterRadius, onEdgeDoubleClick, onEdgeUpdateStart, onEdgeUpdateEnd, children, }: EdgeRendererProps): JSX.Element | null;
    displayName: string;
}>;
export default _default;
//# sourceMappingURL=index.d.ts.map