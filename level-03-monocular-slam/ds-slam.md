# DS-SLAM

> Yu 2018 · [Paper](https://arxiv.org/abs/1809.08379)

**One-line summary** — A semantic visual SLAM for dynamic environments that combines SegNet semantic segmentation with an epipolar motion-consistency check to reject moving objects, built on ORB-SLAM2.

## Key ideas

- **Semantics + geometry for dynamic rejection**: semantic segmentation (SegNet) identifies potentially dynamic classes (chiefly people), while a geometric motion-consistency check — testing whether matched points respect epipolar constraints — determines which of them are actually moving.
- **Filter features, not frames**: ORB features falling on segments judged dynamic are discarded before tracking and optimisation, so the pose estimate is computed from static scene structure only.
- **Parallel thread architecture**: segmentation runs in its own thread alongside ORB-SLAM2's tracking, local mapping, and loop closing, keeping the system near real time.
- **Semantic octree map**: a dense semantic octo-tree map is produced as output, attaching class labels to the reconstructed environment for downstream robotic use.

## Why it matters for SLAM

Classical SLAM assumes a static world, and people walking through a scene can corrupt tracking badly — the TUM RGB-D dynamic sequences exist precisely to expose this. DS-SLAM, contemporaneous with DynaSLAM, is one of the canonical answers: fuse a segmentation network with geometric consistency checks inside an ORB-SLAM2 backbone. The "semantic prior + motion check" recipe it helped establish remains the standard baseline design for dynamic-environment SLAM.

## Related

- [DynaSLAM](dynaslam.md)
- [ORB-SLAM2](orb-slam2.md)
- [DynaSLAM II](dynaslam-ii.md)
- [VDO-SLAM](vdo-slam.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
