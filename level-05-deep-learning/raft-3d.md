# RAFT-3D

> Teed 2021 · [Paper](https://arxiv.org/abs/2012.00726)

**One-line summary** — Extends RAFT from 2D optical flow to 3D scene flow by estimating a dense per-pixel field of rigid-body ($SE(3)$) motions, refined iteratively with geometric consistency.

## Key ideas

- **Scene flow, not just optical flow**: Given RGB-D frame pairs, the goal is the 3D motion of every point — needed to separate camera ego-motion from independently moving objects.
- **Rigid-motion embeddings**: Instead of predicting unconstrained per-pixel 3D translations (as FlowNet3D does), each pixel carries an $SE(3)$ transform. This encodes the prior that real scenes are made of locally rigid objects, and pixels on the same object should share a motion.
- **Soft grouping**: The learned embeddings softly cluster pixels into rigidly moving regions, so rigid-body motion segmentation emerges as a byproduct.
- **RAFT-style iteration**: Correlation lookups plus a ConvGRU update operator iteratively refine the $SE(3)$ field, with a differentiable optimization layer enforcing that the induced 2D flow stays consistent with image evidence.
- Strong results on FlyingThings3D and KITTI scene flow, producing physically plausible motion fields rather than noisy free-form flow.

## Why it matters for SLAM

Dynamic environments are a core SLAM failure mode: moving objects violate the static-world assumption behind ego-motion estimation. RAFT-3D's per-pixel rigid-motion fields provide exactly the representation needed to segment dynamic objects and estimate their motion separately from the camera — the same problem that dynamic SLAM systems (VDO-SLAM, DynaSLAM II) attack with detector-based pipelines. Its combination of learned iterative refinement with an embedded geometric optimization layer sits on the direct lineage from RAFT to DROID-SLAM.

## Related

- [RAFT](raft.md) — the 2D optical flow foundation
- [FlowNet3D](flownet3d.md) — earlier point-cloud scene flow without rigidity priors
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — same authors; dense BA layer in a full SLAM system
- [VDO-SLAM](../level-03-monocular-slam/vdo-slam.md) — dynamic SLAM that tracks object motions

[Back to Level 5](../README.md#level-5-applying-deep-learning)
