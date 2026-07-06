# DPVO

> Teed 2023 · [Paper](https://arxiv.org/abs/2208.04726)

**One-line summary** — A patch-based, lightweight variant of DROID-SLAM showing that sparse patch tracking plus differentiable bundle adjustment matches or beats dense flow at a fraction of the memory and compute.

## Key ideas

- **Sparse patches instead of dense flow**: rather than computing dense correlation volumes between all frame pairs, DPVO tracks a set of image patches across frames with a recurrent update operator — disproving the assumption that dense flow is necessary.
- **Same differentiable BA core**: the DBA layer from DROID-SLAM solves for poses and depths from patch correspondences with learned confidence weights.
- **Dynamic patch management**: patches are added and removed based on visibility and tracking quality, keeping the optimisation problem small.
- **Efficiency**: reported to outperform DROID-SLAM on standard VO benchmarks while using roughly a third of the memory and running about 3x faster, making learned VO practical in real time.
- **VO only**: there is no loop closure or global optimisation — that gap was later filled by DPV-SLAM.

## Why it matters for SLAM

DPVO made differentiable-BA-based visual odometry practical for real-time robotics rather than an offline GPU-heavy affair, and its recurrent-update-on-sparse-patches design was adopted by followers such as MAC-VO and DPV-SLAM (and adapted to event cameras in DEVO). It is the standard modern baseline for learned monocular VO. It appears in both Level 3 (as a monocular system) and Level 5 (as a deep-learning method).

## Related

- [DROID-SLAM](droid-slam.md)
- [DPV-SLAM](dpv-slam.md)
- [MAC-VO](mac-vo.md)
- [RAFT](../level-05-deep-learning/raft.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
