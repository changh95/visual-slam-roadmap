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

## Formal definition and maintenance

Let $\mathcal{P}_i$ be the set of map points observed by keyframe $K_i$. The covisibility weight between two keyframes is simply

$$w_{ij} = \left| \mathcal{P}_i \cap \mathcal{P}_j \right|,$$

and the graph keeps edge $(i, j)$ iff $w_{ij} \geq \theta$. Nothing about this requires poses — it is pure bookkeeping over observations — which is what makes it cheap and incremental:

- **When a keyframe is inserted**, count shared observations with the keyframes that see its matched points (found via each map point's observation list), and add/update edges.
- **When a map point gains or loses an observation** (fusion, culling, tracking new matches), the affected weights are updated locally.
- **When a keyframe is culled**, its edges disappear, and the spanning tree reattaches its children to other neighbours.

In practice each keyframe stores its neighbours sorted by weight, so queries like "the $N$ best covisible keyframes" (used to define the local BA window and to expand loop candidates) are $O(1)$ lookups. Note the asymmetric thresholds in ORB-SLAM's design: the covisibility graph keeps relatively weak edges ($\theta \approx 15$ shared points) because local mapping benefits from a generous neighbourhood, while the essential graph keeps only strong ones ($\theta = 100$) because pose-graph optimisation wants few, reliable constraints.

## Why not time or distance?

It is worth internalising the failure modes of the alternatives. *Temporal* windows (the last $N$ frames) break whenever the camera revisits a place: the old keyframes observing the same scene are excluded from local BA, so the map duplicates and drifts locally. *Metric* neighbourhoods (keyframes within $r$ metres) break with orientation — a keyframe half a metre away but facing the opposite wall shares no observations and contributes nothing but cost — and depend on pose estimates that are themselves drifting. Covisibility sidesteps both by defining neighbourhood in *observation space*: exactly the keyframes whose measurements constrain the same geometry, which is exactly the set local BA needs for a well-conditioned problem.

## Common pitfalls

- **Threshold trade-offs**: too low a $\theta$ and local BA windows balloon (every keyframe in a small room is connected to every other); too high and the graph fragments, starving BA of constraints. Small-room, texture-rich scenes are the stress test.
- **Stale weights**: if point culling/fusion does not update covisibility edges, the graph slowly diverges from reality and local windows include irrelevant keyframes.
- **Confusing the two graphs**: local mapping queries the (dense) covisibility graph; loop-closure pose-graph optimisation runs on the (sparse) essential graph. Running PGO on the full covisibility graph is dramatically slower for marginal accuracy gain — the exact point of the essential-graph design.
- **Assuming covisibility implies matchability**: two keyframes can share many points yet have extreme viewpoint difference; descriptor matching between them may still fail even though the graph says they are neighbours.

## Why it matters for SLAM

The covisibility graph is the data structure that lets feature-based SLAM scale: it bounds the cost of local BA, focuses map-point search, and provides the sparse skeleton (the essential graph) for fast global correction after loop closure. Introduced in ORB-SLAM, it influenced map management in virtually every subsequent keyframe-based system, including ORB-SLAM2/3 and their many derivatives.

## Related

- [ORB-SLAM](orb-slam.md)
- [ORB-SLAM3](orb-slam3.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
