# DXSLAM

> Li 2020 · [Paper](https://arxiv.org/abs/2008.05416)

**One-line summary** — Replaced hand-crafted ORB features with deep features (from an HF-Net-style CNN) inside the ORB-SLAM2 pipeline, significantly improving robustness to illumination change and challenging scenes.

## Key ideas

- **Deep local features in a classical pipeline**: a CNN extracts keypoints and descriptors (plus a global image descriptor), which are dropped into an ORB-SLAM2-style tracking / local mapping / loop closing architecture — the feature extractor is treated as a modular, replaceable component.
- **Learned features for robustness**: features trained on large datasets are far more invariant to severe illumination changes and appearance variation than hand-crafted ORB, which is where classical SLAM most often breaks.
- **Efficient matching and retrieval**: fast approximate nearest-neighbour search (HNSW graphs) and global descriptors keep matching and loop-closure detection efficient despite high-dimensional descriptors.
- **Practical real-time engineering**: network inference and the geometric backend are decoupled so the full system still runs in real time on commodity hardware.

## Why it matters for SLAM

DXSLAM is a clean demonstration of the simplest way to modernise classical SLAM: keep the proven geometric backend, swap in learned features. It showed substantial robustness gains over ORB-SLAM2 in dynamic and lifelong-SLAM settings (OpenLORIS-Scene) without redesigning the system, bridging Level 3's classical systems and Level 5's learned-feature research (SuperPoint, HF-Net). Many production systems follow exactly this hybrid recipe.

## Related

- [ORB-SLAM2](orb-slam2.md)
- [HF-Net](../level-05-deep-learning/hf-net.md)
- [SuperPoint](../level-05-deep-learning/superpoint.md)
- [Learned vs hand-crafted](../level-05-deep-learning/learned-vs-hand-crafted.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
