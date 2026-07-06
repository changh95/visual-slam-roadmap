# QUASAR

> Yang 2019 · [Paper](https://arxiv.org/abs/1905.12536)

**One-line summary** — Certifiably optimal solver for the Wahba problem (single rotation search) with outliers, using a quaternion QCQP formulation and a tight SDP relaxation.

## Key ideas

- **Robust Wahba problem**: Estimating the rotation aligning two sets of vector observations (the Wahba problem) is classical, but real correspondences contain outliers. QUASAR replaces the least-squares cost with a truncated least squares (TLS) cost that caps each residual's influence.
- **Quaternion QCQP**: Parameterizing the rotation as a unit quaternion, and encoding each measurement's inlier/outlier decision with binary variables, turns robust rotation search into a Quadratically Constrained Quadratic Program.
- **SDP relaxation**: Lifting the QCQP to a semidefinite program relaxes the non-convex rank/binary constraints. Empirically the relaxation is tight: the SDP recovers the exact solution of the original non-convex problem.
- **Certificate of optimality**: A zero duality gap between the relaxed and original problems *certifies* that the returned rotation is globally optimal — no local-minimum risk, unlike iterative robust estimators.
- **Extreme outlier robustness**: The TLS formulation tolerates very high outlier fractions where RANSAC-style approaches become unreliable or slow.

## Why it matters for SLAM

Rotation estimation sits inside many SLAM subproblems: point cloud registration, map merging, rotation averaging, and extrinsic calibration. QUASAR is part of the "certifiable perception" line of work (with SE-Sync and TEASER++, largely from the same group) showing that key geometric problems in robotics can be solved to *provable* global optimality even with heavy outlier contamination. The quaternion-QCQP-plus-SDP machinery it introduced became the rotation subsolver inside TEASER++.

## Related

- [SE-Sync](se-sync.md) — certifiable pose graph optimization via SDP relaxation
- [TEASER++](teaserpp.md) — certifiable point cloud registration using the same rotation machinery
- [GNC](gnc.md) — general graduated non-convexity approach to robust estimation

[Back to Level 5](../README.md#level-5-applying-deep-learning)
