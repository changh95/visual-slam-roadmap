# FlowNet3D

> Liu 2019 · [Paper](https://arxiv.org/abs/1806.01411)

**One-line summary** — First end-to-end deep network for 3D scene flow on point clouds, using a PointNet++ backbone with novel flow embedding and set upconv layers to predict a 3D motion vector for every point.

## Problem

Robotics and human-computer interaction need to understand the 3D motion of points in a dynamic environment — *scene flow* — but most prior methods estimated it from stereo or RGB-D images, with few attempts to work directly on point clouds. LiDAR point clouds are sparse, unordered, and grid-free, so standard CNNs (and image-space optical flow architectures) do not apply; prior point-cloud pipelines used hand-crafted features with rigidity or correspondence assumptions. FlowNet3D asks how to learn per-point 3D motion end-to-end from raw pairs of point clouds.

## Method & architecture

Given clouds $\mathcal{P} = \{x_i\}_{i=1}^{n_1}$ and $\mathcal{Q} = \{y_j\}_{j=1}^{n_2}$ with $x_i, y_j \in \mathbb{R}^3$ (no correspondences, possibly different sizes), predict the flow $d_i = x_i' - x_i$ for every point of frame 1. The network has three modules — point feature learning, point mixture, flow refinement — built from three layers:

- **Set conv layer** (PointNet++ set abstraction): farthest-point-samples $n'$ region centers $x_j'$ and aggregates each radius-$r$ neighborhood with a symmetric function

$$f_j' = \underset{\{i \,:\, \lVert x_i - x_j' \rVert \le r\}}{\mathrm{MAX}} \big\{ h(f_i,\ x_i - x_j') \big\}$$

  where $h$ is an MLP and MAX is element-wise max pooling — giving hierarchical, translation-invariant geometry features on irregular data.
- **Flow embedding layer** (new layer #1): for each frame-1 point $p_i$, hard correspondences rarely exist, so the layer aggregates "flow votes" from all frame-2 points in its neighborhood:

$$e_i = \underset{\{j \,:\, \lVert y_j - x_i \rVert \le r\}}{\mathrm{MAX}} \big\{ h(f_i,\ g_j,\ y_j - x_i) \big\}$$

  Feeding both point features to $h$ (rather than a fixed feature-distance) lets the network *learn* how to weight the candidate displacements $y_j - x_i$. The embeddings are then mixed by further set conv layers for spatial smoothness (large receptive fields resolve ambiguous cases like points on a translating table).
- **Set upconv layer** (new layer #2): the same equation as set conv, but evaluated at specified target locations rather than sampled centers, learning to propagate flow embeddings back up to all $n_1$ original points — weighting neighbors by feature relations instead of the inverse-distance weights of 3D interpolation.

The final architecture is 4 set conv layers, 1 flow embedding layer, 4 set upconv layers (with skip connections), and a linear layer regressing the $\mathbb{R}^3$ flow. Training uses smooth-$L_1$ flow supervision plus a cycle-consistency term on the backward flow $d_i'$ predicted from the warped cloud:

$$L = \frac{1}{n_1} \sum_{i=1}^{n_1} \Big( \lVert d_i - d_i^* \rVert + \lambda \lVert d_i' + d_i \rVert \Big)$$

with $\lambda = 0.3$. At inference, the clouds are randomly re-sampled for multiple runs (10) and the predicted flows averaged to reduce sampling noise.

## Results

- **FlyingThings3D** (20,000 train / 2,000 test pairs, disparity+flow popped up to point clouds; metrics: 3D EPE and accuracy): much lower EPE and significantly higher accuracy than an image-based FlowNet-C on depth maps, a global-ICP baseline, and early/late/deep-mixture point-cloud baselines. Ablations: max pooling clearly beats average pooling; the learned two-feature $h$ beats a cosine-distance variant (11.6% error reduction); set upconv beats 3D interpolation (20% flow error reduction); re-sampling and cycle-consistency add further gains.
- **KITTI scene flow** (150 frames with LiDAR, model trained on synthetic data only): 63% relative 3D EPE reduction from the prior art PRSM among RGB-D-based methods, and lower error than both global-ICP and segmentation-ICP baselines — demonstrating strong sim-to-real generalization. With ground points included, FlowNet3D+ICP beats PRSM in EPE, and fine-tuning on 100 real scans improves results further.
- **Applications**: dense scene flow used for partial-scan registration (more robust than ICP stuck in local minima) and for motion segmentation that cleanly separates moving cars from ground and static objects.

## Why it matters for SLAM

FlowNet3D founded deep scene-flow estimation on point clouds, which is how LiDAR SLAM systems can detect and handle dynamic objects — separating moving vehicles and pedestrians from the static structure that mapping should rely on. Its soft-correspondence layer for unordered point sets influenced a wave of successors (PointPWC-Net, FLOT, FastFlow3D) and complements image-based scene flow like RAFT-3D on the RGB-D side; its registration and motion-segmentation demos preview exactly how SLAM systems use scene flow.

## Related

- [FlowNet](flownet.md) — the 2D optical-flow ancestor whose name it inherits
- [RAFT-3D](raft-3d.md) — scene flow from RGB-D imagery with rigid-motion structure
- [RAFT](raft.md) — modern dense 2D correspondence backbone
- [LiDAR](../level-02-getting-familiar/lidar.md) — the sensor producing the point clouds this operates on
- [3D-3D correspondence](../level-02-getting-familiar/3d-3d-correspondence.md) — the classical matching problem this network learns to soften
