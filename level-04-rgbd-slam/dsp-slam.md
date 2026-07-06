# DSP-SLAM

> Wang (UCL) 2021 · [Paper](https://arxiv.org/abs/2108.09481)

**One-line summary** — Augments ORB-SLAM2 with category-level DeepSDF shape priors to reconstruct complete, dense object models online from monocular, stereo, or stereo+LiDAR input.

## Key ideas

- **Shape priors complete unseen geometry**: per-object reconstructions from raw fusion (e.g. Fusion++) are limited to observed viewpoints; a learned DeepSDF prior can hallucinate the unobserved side of a car or chair from sparse, partial observations.
- **ORB-SLAM2 backbone**: sparse feature tracking, keyframing, and the sparse point cloud come from ORB-SLAM2, keeping camera localization classical and robust.
- **DeepSDF as object model**: for each category, a pretrained network $f_\theta(\mathbf{z}, \mathbf{x}) \approx \mathrm{SDF}(\mathbf{x})$ maps a latent shape code and a query point to a signed distance.
- **Joint pose + shape optimization**: for each detected object (Mask R-CNN instances), the object pose, scale, and latent code are optimized so that observed 3D points lie on the zero level set, using second-order (Levenberg-Marquardt) optimization with gradients flowing through the network.
- **Object-aware bundle adjustment**: camera poses, object poses, and background points are refined together in a joint factor graph, so objects act as landmarks too.
- **Multi-modal**: the same framework runs from monocular, stereo, or stereo+LiDAR input.

## Why it matters for SLAM

DSP-SLAM was the first SLAM system to integrate learned implicit shape priors for online object reconstruction, updating the SLAM++ vision — maps made of objects, not raw geometry — for the deep learning era: instead of a database of scanned CAD models, a latent shape space covers a whole category. It is a key stepping stone between classical object-level SLAM (SLAM++, Fusion++, NodeSLAM) and later neural-field object mapping (vMAP), and a good template whenever you need semantically meaningful, complete object models rather than surfel soup.

## Related

- [SLAM++](slampp.md) — the original object-oriented SLAM with a CAD model database
- [Fusion++](fusionpp.md) — per-object TSDFs without shape priors
- [MoreFusion](morefusion.md) — object-level fusion with pose estimation for manipulation
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md) — the underlying SLAM backbone
- [vMAP](../level-03-monocular-slam/vmap.md) — per-object neural fields as the next step

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
