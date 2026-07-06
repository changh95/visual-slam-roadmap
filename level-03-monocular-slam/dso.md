# DSO

> Engel 2016 · [Paper](https://arxiv.org/abs/1607.02565)

**One-line summary** — Direct Sparse Odometry performs full photometric bundle adjustment over a sparse, evenly distributed set of high-gradient pixels, combining the accuracy of direct methods with the efficiency of sparse optimisation.

## Key ideas

- **Photometric bundle adjustment**: instead of minimising reprojection error of matched features, DSO jointly optimises camera poses, inverse depths, and affine brightness parameters by minimising photometric error directly on pixel intensities.
- **Sparse point selection**: rather than all pixels (DTAM) or only corners (ORB-SLAM), points are sampled evenly from all regions with sufficient intensity gradient — including edges and weakly textured surfaces.
- **Full photometric calibration**: DSO models the complete image formation pipeline (exposure time, vignetting, camera response function), which markedly improves direct tracking accuracy.
- **Sliding-window BA with marginalisation**: old keyframes and points are marginalised out via the Schur complement, keeping the optimisation window small and real-time while retaining their information as a prior.
- **No loop closure**: DSO is a visual odometry system with no global optimisation, so drift accumulates; LDSO later added BoW loop closure and Sim(3) pose-graph optimisation.

## Why it matters for SLAM

DSO is the definitive direct sparse method, closing the era opened by DTAM and LSD-SLAM and standing alongside ORB-SLAM as one of the two canonical classical baselines (direct vs feature-based). Its formulation spawned an entire family — LDSO, Stereo DSO, VI-DSO, DVSO, D3VO, DM-VIO — and its photometric-calibration insights and sliding-window marginalisation design are still standard practice in odometry systems today.

## Related

- [LSD-SLAM](lsd-slam.md)
- [LDSO](ldso.md)
- [DVSO](dvso.md)
- [D3VO](d3vo.md)
- [Stereo DSO](../level-07-stereo-slam/stereo-dso.md)

[Back to Level 3](../README.md#level-3-monocular-visual-slam)
