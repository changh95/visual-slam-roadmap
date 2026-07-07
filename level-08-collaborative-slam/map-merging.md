# Map merging

Map merging is the process of aligning submaps built by different robots (or different sessions of the same robot) into a single consistent global map. Each robot starts SLAM in its own arbitrary coordinate frame; merging turns a collection of disconnected local maps into one shared representation.

## The standard pipeline

1. **Find an anchor.** Inter-robot loop closures (place recognition + geometric verification) provide relative pose constraints between keyframes of different maps. One verified closure is enough to relate two frames; several make the alignment well-conditioned.
2. **Estimate the inter-map transform.** From the matched keyframes, compute the transform between the two map frames — $\mathrm{SE}(3)$ when both maps are metric (stereo, RGB-D, VIO), or $\mathrm{Sim}(3)$ (adding scale) when merging monocular maps whose scales differ. Estimation uses PnP or essential-matrix methods over matched features, or 3D-3D alignment of shared landmarks.
3. **Fuse the data.** Transform one map into the other's frame, then merge duplicate content: co-visible landmarks observed by both robots are unified, keyframe databases and covisibility/pose graphs are joined, and the loop-closure edges become ordinary graph edges.
4. **Jointly optimize.** Run pose-graph optimization or bundle adjustment over the merged graph so that the alignment error is distributed through both trajectories rather than concentrated at the seam. In decentralized systems this step is a distributed optimization; in centralized ones the server runs global BA.

## The alignment math

Given $N$ pairs of corresponding 3D points $\{\mathbf{p}_i \leftrightarrow \mathbf{q}_i\}$ (shared landmarks seen by both maps), the inter-map transform is the closed-form least-squares alignment

$$\min_{s,\,\mathbf{R},\,\mathbf{t}} \sum_i \left\| \mathbf{p}_i - (s\,\mathbf{R}\,\mathbf{q}_i + \mathbf{t}) \right\|^2,$$

solved by the Horn/Umeyama method: subtract centroids, take the SVD of the correlation matrix to get $\mathbf{R}$, recover $s$ from the variance ratio ($s \equiv 1$ for the $\mathrm{SE}(3)$ case), then $\mathbf{t}$ from the centroids. Wrapped in RANSAC over the correspondences, this is the workhorse of step 2. When only 2D observations are available (monocular), PnP of one map's landmarks against the other's keyframe, or an essential-matrix decomposition, plays the same role.

One map frame must be chosen as the reference (the *gauge*): typically the older map, the larger map, or the server's canonical frame keeps its coordinates, and the other map is transformed into it.

## Fusing duplicates properly

After alignment the overlap region exists twice. Merging it well matters:

- **Landmark unification**: candidate duplicate landmarks are found by projecting one map's points into the other's keyframes and gating on descriptor distance and reprojection error; matched pairs are collapsed into a single landmark inheriting *both* observation lists.
- **Graph rewiring**: covisibility edges and BoW databases are rebuilt across the seam so future tracking, relocalization, and loop detection treat the merged region as one place — this is essentially the "welding" that ORB-SLAM3's Atlas performs when an old map is re-encountered.
- **Then optimize**: only the joint optimization (step 4) removes the seam; a rigid alignment alone leaves both maps' internal drift intact and merely hides the discontinuity at the anchor.

## Design considerations and pitfalls

- **Merge once vs continually**: merging can happen at first encounter or be refined continually as more inter-map closures arrive; late closures should keep improving the alignment rather than being discarded.
- **Wrong merges are catastrophic**: a false inter-robot closure merges two places that are not the same, so robust back-ends (PCM, GNC) vet closure sets before committing — an unmergeable map is better than a corrupted one.
- **Scale mismatch**: merging two monocular maps with an $\mathrm{SE}(3)$ transform silently forces one map's scale onto the other; use $\mathrm{Sim}(3)$ unless both maps are metric.
- **Double counting**: if duplicate landmarks are *not* unified, the same physical feature contributes twice to the optimization, overweighting the overlap region and biasing the result.
- The same machinery powers *multi-session* SLAM (maplab 2.0, ORB-SLAM3's Atlas): a "robot" can simply be yesterday's mapping run.

## Why it matters for SLAM

Map merging is where collaboration actually pays off: it converts $N$ partial, drifting maps into one map with more coverage and more loop closures than any single robot could achieve. The same concepts — inter-map transforms, duplicate landmark fusion, joint optimization — recur in multi-session mapping, relocalization into prior maps, and crowd-sourced mapping for AR and autonomous driving.

## Related

- [Inter-robot loop closure](inter-robot-loop-closure.md)
- [CCM-SLAM](ccm-slam.md)
- [maplab 2.0](maplab-2-0.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md)
