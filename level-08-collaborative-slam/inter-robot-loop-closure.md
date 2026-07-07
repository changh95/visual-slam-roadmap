# Inter-robot loop closure

An inter-robot loop closure is the detection that two *different* robots have observed the same place, plus the relative pose between their observations. It is the fundamental event in collaborative SLAM: without at least one, two robots' maps are unrelated coordinate frames; with them, submaps can be aligned, merged, and jointly optimized.

## Why it is harder than single-robot loop closure

- **Viewpoint and traversal differences.** A single robot revisiting a corridor tends to see it from a similar height and direction. Two robots may approach the same place from opposite directions, at different heights (air vs ground), at different times of day, or with different cameras — so place recognition must be robust to strong viewpoint, illumination, and even modality changes. This drives the use of robust descriptors: bag-of-words (DBoW2) classically, learned global descriptors (NetVLAD and successors) increasingly.
- **No odometric prior.** Within one robot, candidate loops can be gated by the current pose estimate ("am I near somewhere I've been?"). Across robots there is initially *no* common frame, so candidates must be found by appearance alone over the whole partner map — increasing both cost and the rate of false candidates.
- **Perceptual aliasing is deadlier.** Two similar-looking offices on different floors can generate a false inter-robot match, and a single accepted false closure warps both maps at once.
- **Distributed detection.** In decentralized systems, robots exchange compact descriptors when in range and must decide *which* candidates are worth the bandwidth of full verification (Swarm-SLAM prioritizes candidates that would connect disconnected map components).

## The verification ladder

Because a false closure is catastrophic, acceptance is layered, each stage filtering the previous one's survivors:

1. **Appearance candidate**: descriptor similarity (BoW score, embedding distance) flags keyframe pairs across robots.
2. **Geometric verification**: local features of the two keyframes are matched and a relative pose is estimated with RANSAC (PnP against the partner's local 3D points, or essential matrix from 2D-2D matches); enough inliers → a candidate constraint with covariance.
3. **Consistency across closures**: even geometrically verified closures can be aliased. Robust back-ends check whether *sets* of closures agree with each other before any of them is trusted.

For stage 3, Pairwise Consistency Maximization (PCM, used in DOOR-SLAM) checks each pair of inter-robot closures for mutual consistency: two measurements $\mathbf{z}_{ik}$ and $\mathbf{z}_{jl}$ between robots $a$ and $b$ are consistent if composing them with the robots' own odometry approximately closes the loop,

$$\left\|\,\mathrm{Log}\!\left(\mathbf{z}_{ik}^{-1}\;\hat{\mathbf{x}}^a_{ij}\;\mathbf{z}_{jl}\;\hat{\mathbf{x}}^b_{lk}\right)\right\|_{\Sigma} \le \gamma,$$

a Mahalanobis test over the composed cycle. Building a graph whose nodes are candidate closures and whose edges mark consistent pairs, the largest mutually consistent subset is the maximum clique — outliers, which are inconsistent with the coherent majority, fall outside it. Graduated non-convexity (GNC, used in Kimera-Multi) attacks the same problem inside the optimizer, starting from a convex surrogate cost and progressively sharpening it so outlier edges lose influence.

Once verified, the closure yields a relative pose constraint $T_{a_i b_j}$ between keyframe $i$ of robot $a$ and keyframe $j$ of robot $b$, which enters map merging and global (possibly distributed) pose-graph optimization exactly like any other edge.

## Common pitfalls

- **Trusting geometric verification alone**: RANSAC happily fits an aliased match between two genuinely similar-looking places; only cross-closure consistency catches it.
- **Symmetric environments**: corridors, warehouses, and tunnels produce whole *families* of mutually consistent false closures — the pathological case where even PCM-style vetting needs conservative thresholds.
- **Accepting the first closure greedily**: merging maps on a single unvetted closure bakes its error (or its falseness) into both maps; waiting for a consistent set costs little and saves everything.

## Why it matters for SLAM

Inter-robot loop closures are the currency that buys a *shared* map — the whole point of multi-robot SLAM. Their scarcity (robots may overlap rarely) and their outsized failure cost (one bad closure corrupts every robot's map) explain why modern collaborative systems invest so heavily in robust place recognition and outlier-resilient optimization.

## Related

- [Visual Place Recognition (VPR)](../level-03-monocular-slam/visual-place-recognition-vpr.md)
- [DOOR-SLAM](door-slam.md)
- [Map merging](map-merging.md)
- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [Robust pose-graph optimization](../level-02-getting-familiar/robust-pose-graph-optimization.md)
- [Kimera-Multi](kimera-multi.md)
