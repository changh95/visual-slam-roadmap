# DPVO

> Teed 2023 · [Paper](https://arxiv.org/abs/2208.04726)

**One-line summary** — A patch-based, lightweight variant of DROID-SLAM showing that sparse patch tracking plus differentiable bundle adjustment matches or beats dense flow at a fraction of the memory and compute.

## Problem

Deep VO systems built on dense optical flow (DROID-SLAM) raised accuracy dramatically, but "using dense flow incurs a large computational cost, making these previous methods impractical for many use cases." The field assumed the cost was necessary — that dense flow "is important as it provides additional redundancy against incorrect matches." Deep Patch Visual Odometry (DPVO) set out to test, and ultimately disprove, that assumption: can a sparse, patch-based frontend reach the same accuracy at a fraction of the resources?

## Key ideas

- **Sparse patches instead of dense flow**: rather than computing dense correlation volumes between all frame pairs, DPVO tracks a set of small image patches across time — "exploiting the advantages of sparse patch-based matching over dense flow."
- **Novel recurrent update operator**: a recurrent network architecture designed specifically "for tracking image patches across time" iteratively refines each patch's correspondence, replacing DROID-SLAM's dense ConvGRU flow updates.
- **Same differentiable BA core**: the recurrent patch tracker is "coupled with differentiable bundle adjustment" — the DBA layer solves for camera poses and patch depths from the predicted correspondences with learned confidence weights, exactly as in DROID-SLAM but on a far smaller problem.
- **Dynamic patch management**: patches are added from new frames and dropped as they leave view or track poorly, keeping the optimisation problem small and bounded over time.
- **Efficiency without an accuracy trade**: sparse tracking does not merely approximate the dense system — on standard benchmarks DPVO *outperforms* it, showing the presumed redundancy benefit of dense flow was unnecessary given good patch selection and confidence weighting.
- **VO only**: there is no loop closure or global optimisation — that gap was later filled by DPV-SLAM, built in the same codebase.

## Results & impact

From the abstract: "On standard benchmarks, DPVO outperforms all prior work, including the learning-based state-of-the-art VO-system (DROID) using a third of the memory while running 3x faster on average." This result reset expectations for learned odometry: accuracy leadership no longer required GPU-saturating dense flow, making differentiable-BA VO deployable in real-time robotics. The recurrent-update-on-sparse-patches design was subsequently adopted by MAC-VO (uncertainty-aware stereo VO), DPV-SLAM (full SLAM), and DEVO (event cameras).

## Why it matters for SLAM

DPVO made differentiable-BA-based visual odometry practical for real-time robotics rather than an offline GPU-heavy affair, and its recurrent-update-on-sparse-patches design was adopted by followers such as MAC-VO and DPV-SLAM (and adapted to event cameras in DEVO). It is the standard modern baseline for learned monocular VO. It appears in both Level 3 (as a monocular system) and Level 5 (as a deep-learning method).

## Related

- [DROID-SLAM](droid-slam.md)
- [DPV-SLAM](dpv-slam.md)
- [MAC-VO](mac-vo.md)
- [RAFT](../level-05-deep-learning/raft.md)
- [DEVO](../level-10-event-camera-slam/devo.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
