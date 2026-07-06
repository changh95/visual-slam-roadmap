# Visual Place Recognition (VPR)

**Visual Place Recognition** answers one question: *has the camera been here before?* Given the current image and a database of previously visited places, VPR retrieves the most likely match — the perception half of loop closure detection. It must succeed despite viewpoint changes, lighting changes, weather, and moderate scene change, while *not* firing on distinct places that merely look alike (**perceptual aliasing** — the second identical-looking corridor is VPR's classic enemy).

The classical approach is **Bag of Visual Words (BoVW)**:

1. Offline, cluster a large collection of local descriptors (e.g. ORB) with k-means into a *visual vocabulary* of $K$ words.
2. Represent each image as a histogram over visual words, weighted by **TF-IDF** so that ubiquitous, uninformative words count less.
3. Retrieve candidates via an inverted index (word to images containing it), which makes lookup fast even with thousands of keyframes.

DBoW2/DBoW3 implement this with a hierarchical vocabulary tree ($O(\log K)$ word assignment) and are used by ORB-SLAM, VINS-Mono, and many others. FAB-MAP is the classic probabilistic formulation of the same retrieval idea.

Modern approaches replace hand-crafted histograms with **learned global descriptors**: NetVLAD aggregates CNN features through a differentiable VLAD layer trained with weak GPS supervision; Patch-NetVLAD adds patch-level re-ranking; HF-Net predicts global and local features in one network for a full recognition-plus-localization hierarchy; and current systems increasingly use foundation-model features (e.g. DINO-based descriptors) for robustness to extreme appearance change.

Whatever produces the candidates, a SLAM system never trusts retrieval alone. The standard pipeline is: *retrieve* top-k candidates, then **geometrically verify** — match local features against the candidate, run RANSAC on an essential/PnP model, and require enough inliers (ORB-SLAM additionally requires consistency across covisible keyframes). Only verified matches become loop closure edges, because a single false positive can fold the map.

## Why it matters for SLAM

VPR is what upgrades visual odometry into full SLAM: without recognising previously visited places, drift can never be corrected. The same machinery also provides relocalization after tracking loss, kidnapped-robot recovery, multi-session map merging, and inter-robot loop closures in collaborative SLAM — nearly every "global" capability of a SLAM system rests on place recognition working reliably.

## Related

- [NetVLAD](../level-05-deep-learning/netvlad.md)
- [Patch NetVLAD](../level-05-deep-learning/patch-netvlad.md)
- [HF-Net](../level-05-deep-learning/hf-net.md)
- [ORB-SLAM](orb-slam.md)
- [VO vs SLAM](vo-vs-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
