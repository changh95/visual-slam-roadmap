# Map merging

Map merging is the process of aligning submaps built by different robots (or different sessions of the same robot) into a single consistent global map. Each robot starts SLAM in its own arbitrary coordinate frame; merging turns a collection of disconnected local maps into one shared representation.

The standard pipeline:

1. **Find an anchor.** Inter-robot loop closures (place recognition + geometric verification) provide relative pose constraints between keyframes of different maps. One verified closure is enough to relate two frames; several make the alignment well-conditioned.
2. **Estimate the inter-map transform.** From the matched keyframes, compute the transform between the two map frames — $\mathrm{SE}(3)$ when both maps are metric (stereo, RGB-D, VIO), or $\mathrm{Sim}(3)$ (adding scale) when merging monocular maps whose scales differ. Estimation uses PnP or essential-matrix methods over matched features, or 3D-3D alignment of shared landmarks.
3. **Fuse the data.** Transform one map into the other's frame, then merge duplicate content: co-visible landmarks observed by both robots are unified, keyframe databases and covisibility/pose graphs are joined, and the loop-closure edges become ordinary graph edges.
4. **Jointly optimize.** Run pose-graph optimization or bundle adjustment over the merged graph so that the alignment error is distributed through both trajectories rather than concentrated at the seam. In decentralized systems this step is a distributed optimization; in centralized ones the server runs global BA.

Design considerations: merging can happen once (first encounter) or continually as more inter-map closures arrive, each refining the alignment. Systems must handle *wrong* merges gracefully — a false inter-robot closure merges two places that are not the same, so robust back-ends (PCM, GNC) vet closure sets before committing. The same machinery powers *multi-session* SLAM (maplab 2.0, ORB-SLAM3's Atlas): a "robot" can simply be yesterday's mapping run.

## Why it matters for SLAM

Map merging is where collaboration actually pays off: it converts $N$ partial, drifting maps into one map with more coverage and more loop closures than any single robot could achieve. The same concepts — inter-map transforms, duplicate landmark fusion, joint optimization — recur in multi-session mapping, relocalization into prior maps, and crowd-sourced mapping for AR and autonomous driving.

## Related

- [Inter-robot loop closure](inter-robot-loop-closure.md)
- [CCM-SLAM](ccm-slam.md)
- [maplab 2.0](maplab-2-0.md)
- [Pose graph optimization](../level-02-getting-familiar/pose-graph-optimization.md)
- [ORB-SLAM3](../level-03-monocular-slam/orb-slam3.md)

---
[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
