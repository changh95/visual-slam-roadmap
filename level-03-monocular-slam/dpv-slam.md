# DPV-SLAM

> Lipson 2024 · [Paper](https://arxiv.org/abs/2408.01654)

**One-line summary** — Extended DPVO into a full SLAM system (ECCV 2024) by adding efficient loop-closure and global-correction mechanisms, keeping real-time operation on a single GPU.

## Key ideas

- **From VO to SLAM**: DPVO is a pure odometry system, so its drift grows unboundedly; DPV-SLAM adds the missing back-end pieces — loop closure and global consistency — on top of the patch-graph frontend.
- **Proximity-based loop closure**: loop constraints are formed directly through the existing patch graph when the camera revisits nearby poses, avoiding an expensive separate detection pipeline and running on the same GPU as the frontend.
- **Classical image-retrieval loop closure**: a complementary mechanism detects loops by visual similarity and corrects accumulated drift with pose-graph optimisation, catching loops that proximity alone misses (e.g. after large drift).
- **Efficiency as a design goal**: the system is engineered to avoid the high memory/compute cost that made DROID-SLAM's full-SLAM machinery heavy, preserving DPVO's speed advantage.

## Why it matters for SLAM

DPV-SLAM completes the DROID-SLAM → DPVO arc: differentiable-BA-based visual odometry, made sparse and fast, and finally equipped with loop closure to be a genuine SLAM system competitive with classical pipelines like ORB-SLAM3 on long trajectories. It is a good reference for how learned frontends and classical global optimisation (pose graphs, loop closure) are combined in practice.

## Related

- [DPVO](dpvo.md)
- [DROID-SLAM](droid-slam.md)
- [ORB-SLAM3](orb-slam3.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
