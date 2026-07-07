# DS-SLAM

> Yu 2018 · [Paper](https://arxiv.org/abs/1809.08379)

**One-line summary** — A semantic visual SLAM for dynamic environments that combines SegNet semantic segmentation with a moving-consistency check to reject moving objects, built on ORB-SLAM2.

## Problem

Despite decades of progress, two problems remained poorly solved for mobile-robot SLAM: "how to tackle the moving objects in the dynamic environments" and "how to make the robots truly understand the surroundings and accomplish advanced tasks." A person walking through the scene both corrupts pose estimation (their features violate the static-world assumption) and should arguably be understood, not just ignored. DS-SLAM addresses both at once: robust localisation in dynamic scenes, plus a semantic map usable for higher-level tasks.

## Key ideas

- **Semantics + geometry for dynamic rejection**: semantic segmentation (SegNet) identifies potentially dynamic classes (chiefly people), while a geometric moving-consistency check — testing whether matched points respect the epipolar constraint implied by the estimated motion — determines which segmented regions are *actually* moving. Only the combination is reliable: semantics alone flags parked cars; geometry alone is noisy per-point.
- **Filter features, not frames**: ORB features falling on segments judged dynamic are discarded before tracking and optimisation, so the pose estimate is computed from static scene structure only.
- **Five parallel threads**: "tracking, semantic segmentation, local mapping, loop closing, and dense semantic map creation" run in parallel — segmentation is hidden in its own thread alongside ORB-SLAM2's classic three-thread architecture, keeping the system near real time.
- **Semantic octree map**: a dense semantic octo-tree map is produced as output, attaching class labels to the reconstructed environment — the abstract emphasises it "could be employed for high-level tasks," addressing the second problem above.
- **ORB-SLAM2 as chassis**: the geometric machinery (keyframes, local BA, loop closure) is inherited unchanged; the contribution is the dynamic-feature filter and the semantic mapping layer around it.

## Results & impact

From the abstract: on the TUM RGB-D dataset and in real-world environments, "the absolute trajectory accuracy in DS-SLAM can be improved by one order of magnitude compared with ORB-SLAM2," making it "one of the state-of-the-art SLAM systems in high-dynamic environments." An order-of-magnitude ATE gain on high-dynamic sequences illustrates just how badly moving people break vanilla feature-based SLAM. The code is open-source, and DS-SLAM (with DynaSLAM) became the standard baseline that later dynamic-SLAM papers compare against.

## Why it matters for SLAM

Classical SLAM assumes a static world, and people walking through a scene can corrupt tracking badly — the TUM RGB-D dynamic sequences exist precisely to expose this. DS-SLAM, contemporaneous with DynaSLAM, is one of the canonical answers: fuse a segmentation network with geometric consistency checks inside an ORB-SLAM2 backbone. The "semantic prior + motion check" recipe it helped establish remains the standard baseline design for dynamic-environment SLAM.

## Related

- [DynaSLAM](dynaslam.md)
- [ORB-SLAM2](orb-slam2.md)
- [DynaSLAM II](dynaslam-ii.md)
- [VDO-SLAM](vdo-slam.md)
- [Epipolar geometry](../level-01-beginner/epipolar-geometry.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
