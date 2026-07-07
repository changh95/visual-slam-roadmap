# ACE-SLAM

> Alzugaray 2025 · [Paper](https://arxiv.org/abs/2512.14032)

**One-line summary** — The first neural implicit RGB-D SLAM system to use scene coordinate regression as its core map representation, achieving strict real-time operation with the network weights themselves serving as the map.

## Problem

Neural implicit SLAM systems in the iMAP/NICE-SLAM line showed that a network can serve as a dense map, but they struggled to meet strict real-time budgets and needed separate machinery for relocalization after tracking loss. Scene coordinate regression, meanwhile, had matured (DSAC → ACE → ACE Zero) into an efficient, low-memory, privacy-preserving implicit representation with extremely fast relocalization — but only as an *offline* mapping tool trained after the fact. The open question: can SCR be trained *online*, inside a live SLAM loop, and serve as the single representation for tracking, mapping, and relocalization?

## Key ideas

- **Network weights = map**: the scene is represented entirely by an SCR network that maps 2D image features to 3D global coordinates — no point clouds, voxels, meshes, or stored keyframe images. This is compact, low-memory, and inherently privacy-preserving (the paper highlights exactly these properties as what makes SCR suited to neural implicit SLAM).
- **Mapping as online training**: as RGB-D frames arrive, the lightweight scene-specific network is continuously updated so its coordinate predictions agree with the observed depth under the current pose estimates — supervision comes from back-projecting depth through the estimated poses, so mapping is literally gradient descent on the map.
- **Tracking and relocalization unified**: pose estimation for every frame is SCR-based — predict scene coordinates, then solve PnP with robust estimation. Relocalization after tracking loss is therefore not a separate subsystem; it is the same, extremely fast mechanism that tracks ordinary frames.
- **Tailored SCR architecture**: the authors introduce a novel SCR architecture designed for this purpose and detail the critical design choices required to integrate SCR into a live pipeline (building on the frozen-encoder + small-head recipe that made ACE fast enough to train in minutes).
- **Sparse or dense, static or dynamic**: the resulting framework is simple yet flexible — it seamlessly supports both sparse and dense features, and operates reliably in dynamic environments without special adaptation, since SCR's robust pose solving naturally down-weights points that do not fit the rigid scene.

## Results & impact

ACE-SLAM is the first system to achieve strict real-time operation in neural implicit RGB-D SLAM by relying on an SCR-based representation. Evaluated on established synthetic and real-world benchmarks, it demonstrates performance competitive with the state of the art in neural implicit SLAM, while inheriting SCR's signature properties: a compact low-memory map (network weights only), inherent privacy preservation, and extremely fast relocalization. Code is released at the project page (github.com/ialzugaray/ace-slam). As a recent (2025) paper, its broader influence is still unfolding.

## Why it matters for SLAM

Neural implicit SLAM systems in the iMAP/NICE-SLAM line demonstrated that a network can be the map, but struggled with real-time budgets and needed separate machinery for relocalization. ACE-SLAM shows that scene coordinate regression — matured through DSAC, ACE, and ACE Zero as an offline relocalization technique — can serve as the *single* representation for tracking, mapping, and relocalization in a live SLAM loop. It is a clean demonstration of a relocalizer-centric SLAM design and a natural endpoint (so far) of the ACE lineage.

## Related

- [ACE](ace.md)
- [ACE Zero](ace-zero.md)
- [iMAP](../level-03-monocular-slam/imap.md)
- [NICE-SLAM](../level-03-monocular-slam/nice-slam.md)
- [ACE-G](ace-g.md)

[Back to Level 5](../README.md#level-5-applying-deep-learning)
