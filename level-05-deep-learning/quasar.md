# QUASAR

> Yang 2019 · [Paper](https://arxiv.org/abs/1905.12536)

**One-line summary** — Certifiably optimal solver for the Wahba problem (single rotation search) with outliers, using a quaternion QCQP formulation and a tight SDP relaxation.

## Problem

The Wahba problem — find the rotation that best aligns two sets of vector observations given putative correspondences — is a fundamental routine in computer vision and robotics.

Classical solutions assume Gaussian noise; real correspondence sets contain large fractions of outliers, and standard tools degrade badly there: RANSAC gives no optimality guarantee and slows down as the outlier rate grows, robust local optimization can stall in local minima, and Branch-and-Bound is globally optimal but worst-case exponential. Before QUASAR there was no polynomial-time *certifiably optimal* approach to rotation search with many outliers.

## Key ideas

- **Truncated Least Squares (TLS) cost**: The least-squares objective is replaced by a TLS cost that caps each residual's influence, making the estimate insensitive to a large fraction of spurious correspondences — outliers cannot drag the solution.
- **Quaternion QCQP**: Parameterizing the rotation as a unit quaternion $\mathbf{q}$ (with $\|\mathbf{q}\| = 1$) and encoding each measurement's inlier/outlier decision with binary variables, the TLS rotation-search problem is rewritten exactly as a Quadratically Constrained Quadratic Program.
- **Tight SDP relaxation**: The QCQP is still highly non-convex; lifting it to a semidefinite program (optimizing over $Z = \mathbf{x}\mathbf{x}^\top \succeq 0$ with the rank constraint dropped) yields a convex problem solvable in polynomial time.
- **Naive vs. tailored relaxation**: The paper shows a naive SDP relaxation performs poorly in general — the technical heart of QUASAR is a carefully constructed relaxation that stays tight even in the presence of large noise and outliers.
- **Certificate of optimality**: When the relaxation is exact (rank-1 solution / zero duality gap), the recovered rotation is *provably* the global optimum of the original non-convex robust problem — the solver can tell you it did not get stuck in a local minimum.
- **Joint estimation and outlier rejection**: Because inlier/outlier decisions are variables inside the optimization rather than a pre-processing heuristic, correspondence classification and rotation estimation reinforce each other.

## Results & impact

- Outperformed RANSAC, robust local optimization techniques, global outlier-removal procedures, and Branch-and-Bound methods on both synthetic and real datasets.
- Computes certifiably optimal solutions (the relaxation stays exact) even when 95% of the correspondences are outliers.
- The quaternion-QCQP-plus-SDP machinery became the rotation subsolver inside TEASER/TEASER++, and the paper is a cornerstone of the certifiable-perception research program.

## Why it matters for SLAM

Rotation estimation sits inside many SLAM subproblems: point cloud registration, map merging, rotation averaging, and extrinsic calibration. QUASAR is part of the "certifiable perception" line of work (with SE-Sync and TEASER++, largely from the same group) showing that key geometric problems in robotics can be solved to *provable* global optimality even with heavy outlier contamination. The quaternion-QCQP-plus-SDP machinery it introduced became the rotation subsolver inside TEASER++.

## Related

- [SE-Sync](se-sync.md) — certifiable pose graph optimization via SDP relaxation
- [TEASER++](teaserpp.md) — certifiable point cloud registration using the same rotation machinery
- [GNC](gnc.md) — general graduated non-convexity approach to robust estimation

[Back to Level 5](../README.md#level-5-applying-deep-learning)
