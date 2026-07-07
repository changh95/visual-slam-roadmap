# DSP-SLAM

> Wang (UCL) 2021 · [Paper](https://arxiv.org/abs/2108.09481)

**One-line summary** — Augments ORB-SLAM2 with category-level DeepSDF shape priors to reconstruct complete, dense object models online from monocular, stereo, or stereo+LiDAR input.

## Problem

Object-level SLAM systems without priors (e.g. Fusion++) reconstruct each object only as well as the camera happened to observe it — partial viewpoints yield partial, low-quality models. Learned shape priors such as DeepSDF can complete unseen object parts from sparse observations, but integrating a deep implicit shape model into a real-time SLAM loop — with online pose tracking, sparse and partial data, and a joint map — was an open problem. DSP-SLAM builds a joint map of dense object models for the foreground and sparse landmark points for the background, closing that gap.

## Key ideas

- **ORB-SLAM2 backbone**: sparse feature tracking, keyframing, and the sparse 3D point cloud come from ORB-SLAM2, keeping camera localization classical and robust; DSP-SLAM consumes that point cloud and enriches the map with dense object reconstructions.
- **DeepSDF as category-level object model**: for each category, a pretrained network $f_\theta(\mathbf{z}, \mathbf{x}) \approx \mathrm{SDF}(\mathbf{x})$ maps a latent shape code $\mathbf{z}$ and a 3D query point to a signed distance — one compact latent space stands in for every possible instance shape of the category.
- **Joint pose + shape optimization**: objects are detected via semantic instance segmentation (Mask R-CNN); for each object, the pose $\mathbf{T}_o$, scale $s$, and latent code $\mathbf{z}$ are optimized so observed 3D points lie on the zero level set:
  $$\min_{\mathbf{T}_o,\, s,\, \mathbf{z}} \sum_i \big| f_\theta\big(\mathbf{z},\; s^{-1}\mathbf{T}_o^{-1}\mathbf{x}_i\big) \big|^2 + \lambda_z \|\mathbf{z}\|^2$$
  solved with a novel second-order (Gauss-Newton/Levenberg-Marquardt) scheme, with gradients flowing through the network — much faster and more stable than first-order descent used by prior shape-fitting work.
- **Object-aware bundle adjustment**: a joint pose graph optimizes camera poses, object poses, and background feature points together, so reconstructed objects also serve as landmarks that constrain the trajectory.
- **Three input modalities, one framework**: the same system runs from monocular, stereo, or stereo+LiDAR input at 10 frames per second — the prior fills in whatever the sensor modality cannot observe.

## Results & impact

DSP-SLAM runs at almost frame rate on monocular RGB sequences from the Freiburg and Redwood-OS datasets, and on stereo+LiDAR sequences from the KITTI odometry benchmark, producing high-quality, complete object reconstructions even from partial observations while maintaining a consistent global map. The evaluation shows improved object pose and shape reconstruction relative to recent deep prior-based reconstruction methods, and reduced camera tracking drift on KITTI — evidence that good object models actively help localization.

## Why it matters for SLAM

DSP-SLAM was the first SLAM system to integrate learned implicit shape priors for online object reconstruction, updating the SLAM++ vision — maps made of objects, not raw geometry — for the deep learning era: instead of a database of scanned CAD models, a latent shape space covers a whole category. It is a key stepping stone between classical object-level SLAM (SLAM++, Fusion++, NodeSLAM) and later neural-field object mapping (vMAP), and a good template whenever you need semantically meaningful, complete object models rather than surfel soup.

## Related

- [SLAM++](slampp.md) — the original object-oriented SLAM with a CAD model database
- [Fusion++](fusionpp.md) — per-object TSDFs without shape priors
- [MoreFusion](morefusion.md) — object-level fusion with pose estimation for manipulation
- [ORB-SLAM2](../level-03-monocular-slam/orb-slam2.md) — the underlying SLAM backbone
- [vMAP](../level-03-monocular-slam/vmap.md) — per-object neural fields as the next step

[Back to Level 4](../README.md#level-4-rgb-d-visual-slam)
