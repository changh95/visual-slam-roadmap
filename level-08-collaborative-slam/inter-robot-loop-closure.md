# Inter-robot loop closure

An inter-robot loop closure is the detection that two *different* robots have observed the same place, plus the relative pose between their observations. It is the fundamental event in collaborative SLAM: without at least one, two robots' maps are unrelated coordinate frames; with them, submaps can be aligned, merged, and jointly optimized.

It is strictly harder than single-robot loop closure:

- **Viewpoint and traversal differences.** A single robot revisiting a corridor tends to see it from a similar height and direction. Two robots may approach the same place from opposite directions, at different heights (air vs ground), at different times of day, or with different cameras — so place recognition must be robust to strong viewpoint, illumination, and even modality changes. This drives the use of robust descriptors: bag-of-words (DBoW2) classically, learned global descriptors (NetVLAD and successors) increasingly.
- **No odometric prior.** Within one robot, candidate loops can be gated by the current pose estimate ("am I near somewhere I've been?"). Across robots there is initially *no* common frame, so candidates must be found by appearance alone over the whole partner map — increasing both cost and the rate of false candidates.
- **Perceptual aliasing is deadlier.** Two similar-looking offices on different floors can generate a false inter-robot match, and a single accepted false closure warps both maps at once. Verification is therefore layered: descriptor similarity → feature matching + geometric verification (PnP/essential matrix with RANSAC) → *consistency checking across multiple closures*. Robust back-ends such as Pairwise Consistency Maximization (PCM, in DOOR-SLAM) keep only the largest mutually consistent set of inter-robot closures, and graduated non-convexity (Kimera-Multi) down-weights outliers during optimization itself.
- **Distributed detection.** In decentralized systems, robots exchange compact descriptors when in range and must decide *which* candidates are worth the bandwidth of full verification (Swarm-SLAM prioritizes candidates that would connect disconnected map components).

Once verified, the closure yields a relative pose constraint $T_{a_i b_j}$ between keyframe $i$ of robot $a$ and keyframe $j$ of robot $b$, which enters map merging and global (possibly distributed) pose-graph optimization exactly like any other edge.

## Why it matters for SLAM

Inter-robot loop closures are the currency that buys a *shared* map — the whole point of multi-robot SLAM. Their scarcity (robots may overlap rarely) and their outsized failure cost (one bad closure corrupts every robot's map) explain why modern collaborative systems invest so heavily in robust place recognition and outlier-resilient optimization.

## Related

- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [DOOR-SLAM](door-slam.md)
- [Map merging](map-merging.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md)

---
[Back to Level 8](../README.md#level-8-collaborative--multi-robot-slam)
