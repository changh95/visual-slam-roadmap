# Covisibility graph

Introduced prominently in ORB-SLAM, the **covisibility graph** is a weighted undirected graph over keyframes:

- **Nodes**: keyframes.
- **Edges**: connect two keyframes that observe common map points.
- **Edge weight**: the number of shared map point observations. In ORB-SLAM, an edge is kept when the weight exceeds a threshold $\theta$ (typically around 15 shared points).

The graph encodes *what sees what*, independent of when or where keyframes were created. Two keyframes taken minutes apart from the same viewpoint are strongly connected; two consecutive keyframes during a fast turn may barely be connected at all. This makes covisibility a far better notion of "neighbourhood" for a visual map than time or Euclidean distance.

SLAM systems query the covisibility graph constantly:

- **Local bundle adjustment**: when a new keyframe arrives, optimise it together with its covisibility neighbours and the map points they see — a well-defined local window that automatically includes exactly the relevant geometry.
- **Tracking and map-point retrieval**: project points seen by covisible keyframes into the current frame to find more matches.
- **Loop closure**: candidate places from the recognition database are verified against covisibility neighbourhoods, and detected loops correct not just one pose but the whole covisible group.
- **Keyframe culling**: a keyframe whose observations are largely covered by its covisibility neighbours is redundant and can be removed, keeping the map compact.

A closely related structure is the **essential graph**: a much sparser subgraph consisting of a spanning tree of the keyframes, augmented with high-weight covisibility edges and loop closure edges. ORB-SLAM runs pose-graph optimisation over the essential graph rather than the dense covisibility graph, getting most of the accuracy of full optimisation at a fraction of the cost.

## Why it matters for SLAM

The covisibility graph is the data structure that lets feature-based SLAM scale: it bounds the cost of local BA, focuses map-point search, and provides the sparse skeleton (the essential graph) for fast global correction after loop closure. Introduced in ORB-SLAM, it influenced map management in virtually every subsequent keyframe-based system, including ORB-SLAM2/3 and their many derivatives.

## Related

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
