# ORB-SLAM

> Mur-Artal 2015 · [Paper](https://arxiv.org/abs/1502.00956)

**One-line summary** — A complete, versatile monocular SLAM system that uses ORB features for every task — tracking, mapping, relocalization, and loop closing — with automatic initialisation and robust map management.

## Problem

Prior monocular SLAM systems each solved part of the problem: PTAM had keyframe BA but no loop closure and required manual initialisation; other systems could not handle large environments or recover from tracking loss. ORB-SLAM (IEEE TRO 2015, University of Zaragoza) addressed all of these limitations in a single unified framework built around one feature type, operating in real time "in small and large, indoor and outdoor environments" with robustness to severe motion clutter, wide-baseline loop closing, and full automatic initialisation.

## Key ideas

- **One feature for everything**: oriented FAST keypoints with rotated BRIEF descriptors (ORB) are fast to extract, and binary descriptors enable efficient Hamming-distance matching; the *same* features serve tracking, mapping, relocalization, and loop closing, so no work is duplicated.
- **Automatic initialisation**: a homography $\mathbf{H}$ (planar scenes) and a fundamental matrix $\mathbf{F}$ (general scenes) are computed in parallel; the heuristic score $R_H = S_H / (S_H + S_F)$ selects the right model ($R_H > 0.45$ picks the homography), removing PTAM's manual bootstrap and avoiding degenerate two-view geometry.
- **Three parallel threads**: *tracking* localises every frame against the local map and refines with motion-only BA; *local mapping* inserts keyframes, triangulates points, and runs local BA over the covisibility neighbourhood; *loop closing* detects loops with bag of visual words (DBoW2), computes a $\mathrm{Sim}(3)$ alignment (7 DoF, because monocular scale drifts), and corrects drift via essential-graph optimisation followed by global BA.
- **Bundle adjustment core**: all optimisation minimises robust reprojection error, $\min_{\{\mathbf{T}\},\{\mathbf{X}\}} \sum_{i,j} \rho\big(\lVert \mathbf{u}_{ij} - \pi(\mathbf{T}_{j}\mathbf{X}_i) \rVert^2_{\Sigma_{ij}}\big)$, with a Huber kernel $\rho$.
- **Covisibility graph + essential graph**: keyframes sharing enough map-point observations (typically 15) are connected in a weighted graph that scopes local BA and loop correction to the relevant part of the map; a sparser *essential graph* (spanning tree plus strong edges and loop edges) makes global pose-graph optimisation cheap.
- **Map point management**: a "survival of the fittest" policy culls points that fail a retention test in their first keyframes and removes redundant keyframes, generating "a compact and trackable map that only grows if the scene content changes, allowing lifelong operation" (paper abstract).

## Results & impact

The paper reports an exhaustive evaluation on 27 sequences from the most popular datasets of the time (TUM RGB-D, KITTI, EuRoC), achieving "unprecedented performance with respect to other state-of-the-art monocular SLAM approaches", with median tracking errors below 1 cm on TUM sequences. Just as important, the source code was released publicly; ORB-SLAM became the de facto monocular baseline for years, and its H/F initialisation, covisibility machinery, and keyframe culling were adopted by virtually every subsequent feature-based system.

## Why it matters for SLAM

ORB-SLAM unified the best ideas of a decade — PTAM's parallel tracking/mapping, keyframe BA, place recognition, covisibility — into one robust open-source system, and became the de facto standard monocular SLAM baseline for years. Its initialisation strategy, covisibility graph, and map management were adopted by virtually all subsequent feature-based systems, and it spawned the ORB-SLAM2/3 lineage that still anchors SLAM benchmarking today.

## Related

- [PTAM](ptam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)
- [Covisibility graph](covisibility-graph.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)
- [Keypoints](../level-02-getting-familiar/keypoints.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
