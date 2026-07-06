# ORB-SLAM

> Mur-Artal 2015 · [Paper](https://arxiv.org/abs/1502.00956)

**One-line summary** — A complete, versatile monocular SLAM system that uses ORB features for every task — tracking, mapping, relocalization, and loop closing — with automatic initialisation and robust map management.

## Key ideas

- **One feature for everything**: oriented FAST keypoints with rotated BRIEF descriptors (ORB) are fast to extract, and binary descriptors enable efficient Hamming-distance matching across tracking, relocalization, and loop detection.
- **Automatic initialisation**: a homography $\mathbf{H}$ (planar scenes) and a fundamental matrix $\mathbf{F}$ (general scenes) are computed in parallel; a heuristic score $R_H = S_H / (S_H + S_F)$ selects the right model, removing PTAM's manual bootstrap.
- **Three parallel threads**: tracking localises every frame with motion-only BA; local mapping triangulates points and runs local BA over the covisibility neighbourhood; loop closing detects loops with bag of visual words (DBoW2), computes a $\mathrm{Sim}(3)$ alignment, and corrects drift via essential-graph optimisation followed by global BA.
- **Covisibility graph**: keyframes sharing enough map-point observations (typically 15) are connected in a weighted graph that scopes local BA and loop correction to the relevant part of the map, enabling large-scale operation.
- **Map point management**: a "survival of the fittest" policy culls points that fail a retention test in their first keyframes and culls redundant keyframes, keeping the map compact and accurate.

## Why it matters for SLAM

ORB-SLAM unified the best ideas of a decade — PTAM's parallel tracking/mapping, keyframe BA, place recognition, covisibility — into one robust open-source system, and became the de facto standard monocular SLAM baseline for years. Its initialisation strategy, covisibility graph, and map management were adopted by virtually all subsequent feature-based systems, and it spawned the ORB-SLAM2/3 lineage that still anchors SLAM benchmarking today.

## Related

- [PTAM](ptam.md)
- [ORB-SLAM2](orb-slam2.md)
- [ORB-SLAM3](orb-slam3.md)
- [Covisibility graph](covisibility-graph.md)
- [Visual Place Recognition (VPR)](visual-place-recognition-vpr.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
