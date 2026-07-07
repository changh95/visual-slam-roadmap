# C2TAM

> Riazuelo 2014 · [Paper](https://ieeexplore.ieee.org/document/6696630)

**One-line summary** — C2TAM (Cloud framework for Cooperative Tracking And Mapping) pioneered cloud-based collaborative monocular SLAM, offloading bundle adjustment, relocation, place recognition and map fusion to a server while each robot keeps only lightweight real-time tracking on board.

## Problem

Collaborative monocular SLAM asks each robot to track its own pose *and* maintain a consistent global map — and the map-side cost (especially bundle adjustment) vastly exceeds what lightweight embedded platforms can sustain. Cloud computing offers the obvious division of labor, but raises the make-or-break question: can the SLAM problem be split so that its strong real-time constraints are *not affected* by network delays? C2TAM's answer: only camera-rate tracking is latency-critical; mapping, relocation at scale, place recognition and map fusion can all tolerate the delays of a standard wireless connection if the two loops are decoupled.

## Method & architecture

**PTAM's split, stretched across a network.** Extending the tracking/mapping thread decomposition of PTAM, the *tracking* client runs on the robot against a locally cached copy of the map; the *mapping* service runs in the cloud, holding $l$ maps $\{M_1,\dots,M_l\}$, each $M=\{P_1,\dots,P_n,\,C_1,\dots,C_m\}$ of 3D points and keyframes. Each point carries multi-scale patch descriptors; each keyframe carries a "tiny image" global descriptor — the frame subsampled to 40×30, Gaussian-filtered and mean-normalized: $d_c = I_c^{40\times30}\ast g(\sigma) - \overline{I_c^{40\times30}\ast g(\sigma)}$.

**Cloud mapping = bundle adjustment.** The server computes the maximum-likelihood map by minimizing robust reprojection error over all points $P_i$ and keyframes $C_j$:

$$\left(\hat{P}_i,\hat{C}_j\right)=\arg\min_{P_i,C_j}\sum_{i=1}^{n}\sum_{j=1}^{m}\rho\left(\Delta z_i^j/\sigma\right),\qquad \Delta z_i^j = z_i^j - f(P_i,C_j,K_j)$$

where $f$ is the projection model, $\sigma$ a median-based noise estimate, and $\rho$ Tukey's biweight function, which zeroes out residuals with $|\xi|>1$ to reject outliers.

**Client tracking.** Per frame: (1) constant-velocity pose prediction; (2) coarse pose from the coarsest-scale points, $\hat{T}_t^{\ast}=\arg\min_{T_t}\sum_i \rho(\Delta z_i^{\ast}/\sigma^{\ast})$; (3) fine pose $\hat{T}_t$ re-minimized over every map point at every scale. Map initialization replaces PTAM's manual translation ritual with an interacting multiple-model filter on the client, sending the first two keyframes to the server once parallax is sufficient.

**What crosses the network.** The tracker uploads a new *raw keyframe* (640×480 RGB, ~1 MB) only when the image contains new information relative to the map; the server streams back optimized 3D points. Tracking never blocks on the network: it continues on the cached (possibly suboptimal) map and swaps in updates as they arrive.

**Relocation, place recognition, map fusion — all cloud services.** Relocation after tracking loss is two-step: nearest keyframe by Euclidean distance between tiny-image descriptors, then rotation-compensated pose refinement. Place recognition runs the same search over *all* stored maps to recognize which map a new user is in. Map fusion fires when a newly uploaded keyframe of $M_k$ matches a keyframe of $M_q$: 3D points of both maps are projected into the common keyframe, correspondences give the rigid transformation, maps merge and duplicated points are deleted — entirely server-side, while the client keeps tracking on its suboptimal map.

## Results

All experiments ran in real time over the university's standard WiFi, with RGB-D cameras at 640×480 (only RGB used for SLAM; depth for visualization).

- **Cost and bandwidth** (4961-frame sequence): client tracking stays ~10 ms/frame — constant even as the map grows to thousands of points, well under the 33 ms frame budget (automatic initialization costs ~70 ms/frame for the first 20 frames). Average bandwidth ~1 MB/s against a measured 1.45 MB/s available link; keyframe upload (~1 MB) implies ~1 s delay, map download 100-200 ms — both far above the 1/30 s frame period, justifying the asynchronous design.
- **Relocation in multiple maps**: three stored maps (desktop, wall/bookshelf, hospital room) are each recognized and *extended* by a new sequence traversing the lab — desktop 2662 points/28 keyframes → 3313/47; wall 2711/32 → 3987/58; room 642/29 → 1624/58.
- **Accuracy**: tape-measured ground truth vs map measurements agree to millimeters-centimeters, e.g. laptop 0.340 m vs 0.337 m, bed 2.039 m vs 2.044 m, walls 3.105 m vs 3.096 m.
- **Map fusion**: an online desktop-A map (112 keyframes, 7925 points) fused with a stored desktop-B map (42 keyframes, 4098 points); the ~16 MB post-fusion download took ~5 s while client tracking continued unaffected.
- A cooperative two-user experiment showed two independent maps of the same room fused on overlap, then jointly extended by both trackers.

## Why it matters for SLAM

C2TAM established the cloud-robotics division of labor for SLAM — heavy optimization in the cloud, camera-rate tracking at the edge — and demonstrated that real network latency is compatible with real-time visual SLAM when the two loops are decoupled asynchronously. Its stored-map relocation and server-side map fusion prefigure map reuse as a cloud service (it grew out of the RoboEarth project). It is the direct conceptual ancestor of CCM-SLAM, which rebuilt the same architecture on an ORB-SLAM backbone with a far more bandwidth-frugal protocol (keypoints and descriptors instead of C2TAM's raw keyframe images).

## Related

- [PTAM](../level-03-monocular-slam/ptam.md)
- [CCM-SLAM](ccm-slam.md)
- [Centralized vs Decentralized](centralized-vs-decentralized.md)
- [Communication constraints](communication-constraints.md)
- [Map merging](map-merging.md)
