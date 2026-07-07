# RAFT-3D

> Teed 2021 · [Paper](https://arxiv.org/abs/2012.00726)

**One-line summary** — Extends RAFT from 2D optical flow to 3D scene flow by estimating a dense per-pixel field of rigid-body ($SE(3)$) motions, refined iteratively with geometric consistency.

## Problem

Scene flow — given a pair of stereo or RGB-D video frames, estimate the pixelwise 3D motion — is what a robot actually needs to separate camera ego-motion from independently moving objects, but optical flow only delivers 2D displacements and earlier 3D methods (e.g., FlowNet3D) predict unconstrained per-point translations.

Free-form 3D flow ignores the strongest prior about real scenes: they are composed of rigid objects, so predictions come out noisy and physically implausible. RAFT-3D asks how to build that rigidity prior into a RAFT-style dense estimation architecture without requiring object instance labels.

## Key ideas

- **Dense $SE(3)$ motion field instead of 2D flow**: RAFT-3D keeps RAFT's recipe — per-pixel features, correlation lookups, iterative ConvGRU updates — but the state it refines is a dense field of pixelwise $SE(3)$ rigid-body transforms rather than a 2D displacement field.
- **Rigid-motion embeddings**: Each pixel carries a learned embedding representing a *soft grouping* of pixels into rigid objects; pixels whose embeddings agree are encouraged to share one rigid motion. Rigid-body motion segmentation therefore emerges as a byproduct, with no object instance supervision.
- **Dense-SE3 differentiable layer**: Integral to the embeddings is Dense-SE3, a differentiable optimization layer that enforces geometric consistency of the embeddings at every iteration — each GRU step is followed by a least-squares update that keeps the $SE(3)$ field consistent with the image evidence.
- **Geometry in the loop, not post-hoc**: Because the consistency layer is differentiable, the network learns features and embeddings that make the embedded geometric optimization succeed — the same design philosophy that later powered DROID-SLAM's dense bundle adjustment layer.
- **2D flow for free**: Composing the per-pixel $SE(3)$ transform with depth and projection induces a 2D flow field, so the rigid 3D representation remains directly comparable against image evidence during iterative refinement.
- **Structured output for downstream use**: The result is a per-pixel rigid transform plus an implicit object grouping — directly usable for ego-motion estimation, dynamic-object segmentation, and object velocity estimation.

## Results & impact

- On FlyingThings3D, under the two-view evaluation, improved the best published accuracy ($d < 0.05$) from 34.3% to 83.7% — a dramatic jump attributable to the rigidity prior.
- On KITTI scene flow, achieved an error of 5.77, outperforming the best published method (6.31), despite using no object instance supervision.
- Produces physically plausible motion fields with emergent rigid-body segmentation, and its differentiable geometric-layer design fed directly into the same authors' DROID-SLAM.

## Why it matters for SLAM

Dynamic environments are a core SLAM failure mode: moving objects violate the static-world assumption behind ego-motion estimation. RAFT-3D's per-pixel rigid-motion fields provide exactly the representation needed to segment dynamic objects and estimate their motion separately from the camera — the same problem that dynamic SLAM systems (VDO-SLAM, DynaSLAM II) attack with detector-based pipelines. Its combination of learned iterative refinement with an embedded geometric optimization layer sits on the direct lineage from RAFT to DROID-SLAM.

## Related

- [RAFT](raft.md) — the 2D optical flow foundation
- [FlowNet3D](flownet3d.md) — earlier point-cloud scene flow without rigidity priors
- [DROID-SLAM](../level-03-monocular-slam/droid-slam.md) — same authors; dense BA layer in a full SLAM system
- [VDO-SLAM](../level-03-monocular-slam/vdo-slam.md) — dynamic SLAM that tracks object motions

[Back to Level 5](../README.md#level-5-applying-deep-learning)
